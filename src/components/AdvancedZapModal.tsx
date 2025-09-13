import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Copy, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";

interface AdvancedZapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  amount: number;
  onPaid?: (amount: number) => void;
}

const AdvancedZapModal = ({ open, onOpenChange, postId, amount, onPaid }: AdvancedZapModalProps) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [invoice, setInvoice] = useState("");
  const [qrData, setQrData] = useState("");
  const [paymentHash, setPaymentHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'comment' | 'invoice' | 'payment'>('comment');

  useEffect(() => {
    if (open) {
      setComment("");
      setInvoice("");
      setQrData("");
      setPaymentHash("");
      setStep('comment');
    }
  }, [open]);

  const handleGenerateInvoice = async () => {
    if (!user) {
      toast.error("Please sign in to zap posts");
      return;
    }

    setLoading(true);
    try {
      // Call our edge function to create invoice
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          amount: amount,
          description: `Zap for ${amount} sats${comment ? ': ' + comment : ''}`,
        }
      });

      if (error) throw error;

      setInvoice(data.invoice);
      setQrData(data.qr_data);
      setPaymentHash(data.payment_hash);
      setStep('invoice');
      toast.success("Invoice generated successfully!");
      
    } catch (error: any) {
      console.error('Invoice generation error:', error);
      toast.error(error.message || "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessZap = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Process the zap through our edge function
      const { data, error } = await supabase.functions.invoke('process-zap', {
        body: {
          postId: postId,
          amount: amount,
          comment: comment || undefined,
          paymentHash: paymentHash,
          invoice: invoice
        }
      });

      if (error) throw error;

      toast.success(`⚡ Zapped ${amount} sats successfully!`);
      onPaid?.(amount);
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Zap processing error:', error);
      toast.error(error.message || "Failed to process zap");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const openInWallet = () => {
    window.open(`lightning:${invoice}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sn-red" />
            Zap {amount} sats
          </DialogTitle>
          <DialogDescription>
            Send sats to support this post. Your payment goes directly to the author.
          </DialogDescription>
        </DialogHeader>

        {step === 'comment' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Great post! ⚡"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleGenerateInvoice} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Generating..." : `Generate Invoice for ${amount} sats`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'invoice' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-white p-4 rounded-lg border">
                <QRCode
                  value={qrData}
                  size={180}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-sm text-sn-text-muted mt-2">
                Scan with your Lightning wallet
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Lightning Invoice</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={invoice}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(invoice)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {comment && (
                <div>
                  <Label>Comment</Label>
                  <p className="text-sm text-foreground p-2 bg-sn-surface-muted rounded">
                    {comment}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={openInWallet}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Wallet
              </Button>
              <Button 
                onClick={handleProcessZap}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Processing..." : "I've Paid"}
              </Button>
            </div>
            
            <div className="text-xs text-center text-sn-text-muted">
              Click "I've Paid" after completing the payment in your wallet
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedZapModal;