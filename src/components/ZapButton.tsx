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
    <div className="flex items-center space-x-2">
      {zapAmounts.map((amount) => (
        <Button
          key={amount}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={() => openZap(amount)}
        >
          <Zap className="h-3 w-3 mr-1" />
          {amount}
        </Button>
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