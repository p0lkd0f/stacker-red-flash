import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ZapButtonProps {
  postId: number;
  currentSats: number;
  onZap: (amount: number) => void;
}

const ZapButton = ({ postId, currentSats, onZap }: ZapButtonProps) => {
  const [isZapping, setIsZapping] = useState(false);
  
  const zapAmounts = [21, 100, 500, 1000];

  const handleZap = async (amount: number) => {
    setIsZapping(true);
    
    // Simulate zapping delay
    setTimeout(() => {
      onZap(amount);
      setIsZapping(false);
      toast.success(`⚡ Zapped ${amount} sats!`, {
        description: "Your sats have been sent to the author"
      });
    }, 500);
  };

  return (
    <div className="flex items-center space-x-2">
      {zapAmounts.map((amount) => (
        <Button
          key={amount}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs border-sn-red text-sn-red hover:bg-sn-red hover:text-white transition-all duration-200"
          onClick={() => handleZap(amount)}
          disabled={isZapping}
        >
          <Zap className="h-3 w-3 mr-1" />
          {amount}
        </Button>
      ))}
    </div>
  );
};

export default ZapButton;