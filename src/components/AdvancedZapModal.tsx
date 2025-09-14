import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const AdvancedZapModal = ({ open, onOpenChange, postId, amount: defaultAmount, onPaid }: AdvancedZapModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState(defaultAmount);
  const [invoice, setInvoice] = useState("");
  const [qrData, setQrData] = useState("");
  const [paymentHash, setPaymentHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'amount' | 'payment'>('amount');

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount);
      setInvoice("");
      setQrData("");
      setPaymentHash("");
      setStep('amount');
    }
  }, [open, defaultAmount]);

  const handleGenerateInvoice = async () => {
    if (!user) {
      toast.error("Please sign in to zap posts");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      // Call our edge function to create invoice
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          amount: amount,
          description: `Zap for ${amount} sats`,
        }
      });

      if (error) throw error;

      setInvoice(data.invoice);
      setQrData(data.qr_data);
      setPaymentHash(data.payment_hash);
      setStep('payment');
      toast.success("Invoice generated! Please pay to complete the zap.");
      
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sn-red" />
            {step === 'amount' ? 'Zap this post' : `Zap ${amount} sats`}
          </DialogTitle>
          <DialogDescription>
            {step === 'amount' 
              ? 'Send sats to support this post. Your payment goes directly to the author.'
              : 'Pay the Lightning invoice to complete your zap.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (sats)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
              />
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleGenerateInvoice} 
                disabled={loading || !amount || amount <= 0}
                className="w-full"
              >
                {loading ? "Generating..." : `Generate Invoice for ${amount || 0} sats`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'payment' && (
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