import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNostr } from "@/contexts/NostrContext";
import { nostrService } from "@/lib/nostr";
import { Loader2 } from "lucide-react";

interface ZapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number; // sats
  recipientPubkey?: string;
  postId?: string;
  onPaid?: (amount: number) => void;
}

const ZapModal = ({ open, onOpenChange, amount, recipientPubkey, postId, onPaid }: ZapModalProps) => {
  const { user, isAuthenticated } = useNostr();
  const [comment, setComment] = useState("");
  const [invoice, setInvoice] = useState<any>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [paying, setPaying] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setInvoice(null);
      setPaying(false);
      setIsCreatingInvoice(false);
      loadRecipientProfile();
    }
  }, [open, recipientPubkey]);

  const loadRecipientProfile = async () => {
    if (!recipientPubkey) return;
    
    try {
      const profile = await nostrService.getUserProfile(recipientPubkey);
      setRecipientProfile(profile);
    } catch (error) {
      console.error('Failed to load recipient profile:', error);
    }
  };

  const canPay = useMemo(() => !!invoice && !!user?.nwcUri, [invoice, user?.nwcUri]);

  const handleCreateZapRequest = async () => {
    if (!isAuthenticated || !recipientPubkey) {
      toast.error("Authentication required");
      return;
    }
    
    if (!recipientProfile?.lud16) {
      toast.error("Recipient has no Lightning address configured");
      return;
    }
    
    setIsCreatingInvoice(true);
    try {
      const zapRequest = {
        amount,
        comment: comment.trim(),
        recipient: recipientPubkey,
        postId
      };
      
      const createdInvoice = await nostrService.createZapRequest(zapRequest);
      setInvoice(createdInvoice);
      toast.success("Zap request created! Ready to pay.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create zap request");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handlePay = async () => {
    if (!invoice || !user?.nwcUri) {
      toast.error("Invoice or wallet connection missing");
      return;
    }
    
    setPaying(true);
    try {
      const success = await nostrService.payInvoice(invoice);
      if (success) {
        toast.success(`⚡ Zapped ${amount} sats!`);
        onPaid?.(amount);
        onOpenChange(false);
      } else {
        toast.error("Payment failed");
      }
    } catch (e: any) {
      toast.error(e?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handleCancel = () => {
    if (invoice && !invoice.paid) {
      // Mark invoice as cancelled
      toast.info("Zap cancelled");
    }
    onOpenChange(false);
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
            <DialogDescription>
              Please connect your Nostr account to send zaps.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user?.nwcUri) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Connection Required</DialogTitle>
            <DialogDescription>
              Please configure your Nostr Wallet Connect (NWC) to send zaps.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zap {amount} sats</DialogTitle>
          <DialogDescription>
            {recipientProfile?.name || 'User'} • {recipientProfile?.lud16 || 'No Lightning address'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!invoice ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="comment">Comment (optional)</Label>
                <Input 
                  id="comment" 
                  placeholder="Great post! ⚡" 
                  value={comment} 
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={280}
                />
                <p className="text-xs text-muted-foreground">
                  {comment.length}/280 characters
                </p>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Amount:</span>
                  <span className="font-bold">{amount} sats</span>
                </div>
                {comment && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Comment:</span>
                    <p className="text-sm mt-1">{comment}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800">⚡ Zap Request Ready</h4>
                <p className="text-sm text-green-700 mt-1">
                  Invoice created for {amount} sats
                </p>
              </div>
              
              {comment && (
                <div className="bg-muted p-3 rounded-lg">
                  <span className="text-sm font-medium">Your comment:</span>
                  <p className="text-sm mt-1">{comment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          
          {!invoice ? (
            <Button 
              onClick={handleCreateZapRequest}
              disabled={isCreatingInvoice || !recipientProfile?.lud16}
              className="bg-sn-red hover:bg-sn-red-hover"
            >
              {isCreatingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Zap Request'
              )}
            </Button>
          ) : (
            <Button 
              onClick={handlePay} 
              disabled={!canPay || paying}
              className="bg-sn-red hover:bg-sn-red-hover"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Paying...
                </>
              ) : (
                `Pay ${amount} sats`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ZapModal;
      toast.success(`⚡ Paid ${amount} sats`);
      onPaid?.(amount);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const handleSaveNwc = () => {
    const el = document.getElementById("nwc-uri-input") as HTMLInputElement | null;
    const uri = el?.value?.trim();
    if (!uri) {
      toast.error("Enter your NWC URI");
      return;
    }
    try {
      setNwcCredentials(uri);
      setNwcUri(uri);
      toast.success("Wallet connected via NWC");
    } catch {
      toast.error("Failed to save NWC URI");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zap {amount} sats</DialogTitle>
          <DialogDescription>Pay the author using your Nostr-connected lightning wallet.</DialogDescription>
        </DialogHeader>

        {/* Wallet Config */}
        {!nwcUri && (
          <div className="space-y-2">
            <Label htmlFor="nwc-uri-input">NWC URI</Label>
            <Input id="nwc-uri-input" placeholder="nostr+walletconnect://..." />
            <p className="text-xs text-muted-foreground">Paste your Nostr Wallet Connect URI (e.g., from Alby). Stored locally.</p>
            <Button variant="secondary" onClick={handleSaveNwc}>Connect Wallet</Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="ln-addr">Recipient Lightning Address</Label>
            <Input id="ln-addr" placeholder="name@domain.com" value={lightningAddress} onChange={(e) => setLightningAddress(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Input id="comment" placeholder="⚡ zap!" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleGenerateInvoice} disabled={loadingInvoice}>
              {loadingInvoice ? "Generating..." : "Get Invoice"}
            </Button>
            <span className="text-sm text-muted-foreground">or paste a BOLT11 invoice below</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invoice">Invoice (BOLT11)</Label>
            <Input id="invoice" placeholder="lnbc1..." value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handlePay} disabled={!canPay || paying}>
            {paying ? "Paying..." : `Pay ${amount} sats with NWC`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ZapModal;
