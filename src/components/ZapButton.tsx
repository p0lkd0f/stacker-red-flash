import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdvancedZapModal from "@/components/AdvancedZapModal";

interface ZapButtonProps {
  postId: string;
  currentSats: number;
  onZap: (amount: number) => void;
}

const ZapButton = ({ postId, currentSats, onZap }: ZapButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const zapAmounts = [21, 100, 500, 1000];

  const openZap = (amount: number) => {
    setSelectedAmount(amount);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      {zapAmounts.map((amount) => (
        <button
          key={amount}
          className="group flex items-center justify-center w-8 h-6 text-xs font-medium text-sn-text-muted hover:text-sn-red hover:bg-sn-red/10 rounded transition-all duration-200 hover:scale-105"
          onClick={() => openZap(amount)}
        >
          <Zap className="h-3 w-3 mr-0.5 fill-current" />
          <span>{amount}</span>
        </button>
      ))}

      {selectedAmount !== null && (
        <AdvancedZapModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          postId={postId}
          amount={selectedAmount}
          onPaid={(amt) => {
            onZap(amt);
          }}
        />
      )}
    </div>
  );
};

export default ZapButton;