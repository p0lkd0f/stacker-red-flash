import { ArrowUp, MessageCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PostItemProps {
  id: number;
  title: string;
  url?: string;
  sats: number;
  boost?: string;
  comments: number;
  author: string;
  timeAgo: string;
  category: string;
  isTopBoost?: boolean;
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
  isTopBoost 
}: PostItemProps) => {
  return (
    <div className="flex items-start space-x-3 py-3 border-b border-sn-border last:border-b-0">
      {/* Vote Arrow */}
      <div className="flex flex-col items-center mt-1">
        <button className="p-1 hover:bg-sn-light-gray rounded transition-colors">
          <ArrowUp className="h-4 w-4 text-sn-gray hover:text-sn-red" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start space-x-2">
          <h3 className="text-foreground hover:text-sn-red cursor-pointer transition-colors font-medium leading-tight">
            {title}
          </h3>
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
          <span className="font-medium">{sats.toLocaleString()} sats</span>
          {boost && (
            <>
              <span>\</span>
              <span>{boost} boost</span>
            </>
          )}
          <span>\</span>
          <button className="hover:text-sn-red transition-colors flex items-center space-x-1">
            <MessageCircle className="h-3 w-3" />
            <span>{comments} comments</span>
          </button>
          <span>\</span>
          <button className="hover:text-sn-red transition-colors">@{author}</button>
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
      </div>
    </div>
  );
};

export default PostItem;