import { ArrowUp, MessageCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import ZapButton from "./ZapButton";
import ZapModal from "./ZapModal";
interface PostItemProps {
  id: string;
  title: string;
  url?: string;
  sats: number;
  boost?: string;
  comments: number;
  author: string;
  timeAgo: string;
  category: string;
  isTopBoost?: boolean;
  onZap?: (postId: string, amount: number) => void;
}

const PostItem = ({ 
  id, 
  title, 
  url, 
  sats, 
  boost, 
  comments, 
  author, 
  timeAgo, 
  category,
  isTopBoost,
  onZap
}: PostItemProps) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [currentSats, setCurrentSats] = useState(sats);
  const [isUpvoteModalOpen, setIsUpvoteModalOpen] = useState(false);
const handleVote = () => {
  if (!hasVoted) {
    const newSats = currentSats + 10;
    setCurrentSats(newSats);
    setHasVoted(true);
    onZap?.(id, 10);
    toast.success("Upvoted! +10 sats");
    setIsUpvoteModalOpen(true);
  }
};

  const handleZap = (amount: number) => {
    const newSats = currentSats + amount;
    setCurrentSats(newSats);
    onZap?.(id, amount);
  };

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-sn-border last:border-b-0">
      {/* Vote Arrow */}
      <div className="flex flex-col items-center mt-1">
        <button 
          className={`p-1 hover:bg-sn-light-gray rounded transition-colors ${
            hasVoted ? 'text-sn-red' : 'text-sn-gray hover:text-sn-red'
          }`}
          onClick={handleVote}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start space-x-2">
          <Link 
            to={`/post/${id}`}
            className="text-foreground hover:text-sn-red cursor-pointer transition-colors font-medium leading-tight"
          >
            {title}
          </Link>
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sn-text-muted hover:text-sn-red text-sm flex-shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {url && (
          <div className="text-xs text-sn-text-muted mt-1">
            {new URL(url).hostname}
          </div>
        )}

        <div className="flex items-center space-x-3 mt-2 text-xs text-sn-text-muted">
          <span className="font-medium">{currentSats.toLocaleString()} sats</span>
          {boost && (
            <>
              <span>\</span>
              <span>{boost} boost</span>
            </>
          )}
          <span>\</span>
          <Link 
            to={`/post/${id}`}
            className="hover:text-sn-red transition-colors flex items-center space-x-1"
          >
            <MessageCircle className="h-3 w-3" />
            <span>{comments} comments</span>
          </Link>
          <span>\</span>
          <Link 
            to="/profile" 
            className="hover:text-sn-red transition-colors"
          >
            @{author}
          </Link>
          <span>{timeAgo}</span>
          <Badge 
            variant="secondary" 
            className="text-xs bg-sn-light-gray text-sn-text-muted hover:bg-sn-red hover:text-white cursor-pointer"
          >
            {category}
          </Badge>
          {isTopBoost && (
            <Badge className="bg-sn-red text-white text-xs">top boost</Badge>
          )}
        </div>

        {/* Zap Buttons */}
        <div className="mt-3">
          <ZapButton 
            postId={id} 
            currentSats={currentSats} 
            onZap={handleZap} 
          />
        </div>

        {isUpvoteModalOpen && (
          <ZapModal
            open={isUpvoteModalOpen}
            onOpenChange={setIsUpvoteModalOpen}
            amount={10}
          />
        )}
      </div>
    </div>
  );
};

export default PostItem;