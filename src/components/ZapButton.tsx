import { useState } from "react";
import { Zap } from "lucide-react";
import AdvancedZapModal from "@/components/AdvancedZapModal";

interface ZapButtonProps {
  postId: string;
  currentSats: number;
  onZap: (amount: number) => void;
}

const ZapButton = ({ postId, currentSats, onZap }: ZapButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openZap = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        className="group flex items-center justify-center w-8 h-6 text-sn-text-muted hover:text-sn-red hover:bg-sn-red/10 rounded transition-all duration-200 hover:scale-105"
        onClick={openZap}
      >
        <Zap className="h-4 w-4 fill-current" />
      </button>

      <AdvancedZapModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        postId={postId}
        amount={100} // Default starting value, user can change it
        onPaid={(amt) => {
          onZap(amt);
        }}
      />
    </div>
  );
};

export default ZapButton;