import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap } from "lucide-react";

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount);
    }
  }, [open, defaultAmount]);

  const handleZap = async () => {
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
      // Process the zap directly through our edge function
      const { data, error } = await supabase.functions.invoke('process-zap', {
        body: {
          postId: postId,
          amount: amount,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sn-red" />
            Zap this post
          </DialogTitle>
          <DialogDescription>
            Send sats to support this post. Your payment goes directly to the author.
          </DialogDescription>
        </DialogHeader>

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
              onClick={handleZap} 
              disabled={loading || !amount || amount <= 0}
              className="w-full"
            >
              {loading ? "Processing..." : `⚡ Zap ${amount || 0} sats`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedZapModal;