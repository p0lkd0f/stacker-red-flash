import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLNClient, getNwcCredentials, setNwcCredentials } from "@/lib/nwc";
import { fetchInvoiceFromLightningAddress } from "@/lib/lightning";

interface ZapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number; // sats
  onPaid?: (amount: number) => void;
}

const ZapModal = ({ open, onOpenChange, amount, onPaid }: ZapModalProps) => {
  const [lightningAddress, setLightningAddress] = useState("");
  const [comment, setComment] = useState("");
  const [invoice, setInvoice] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [paying, setPaying] = useState(false);
  const [nwcUri, setNwcUri] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setInvoice("");
      setPaying(false);
      setLoadingInvoice(false);
      setNwcUri(getNwcCredentials());
    }
  }, [open]);

  const canPay = useMemo(() => !!invoice && !!nwcUri, [invoice, nwcUri]);

  const handleGenerateInvoice = async () => {
    if (!lightningAddress) {
      toast.error("Enter a lightning address");
      return;
    }
    setLoadingInvoice(true);
    try {
      const pr = await fetchInvoiceFromLightningAddress(lightningAddress.trim(), amount, comment.trim() || undefined);
      setInvoice(pr);
      toast.success("Invoice ready");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate invoice. You can paste one manually.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handlePay = async () => {
    if (!invoice) {
      toast.error("No invoice to pay");
      return;
    }
    const ln = getLNClient();
    if (!ln) {
      toast.error("Connect a Nostr Wallet (NWC) first");
      return;
    }
    setPaying(true);
    try {
      await ln.pay(invoice);
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
