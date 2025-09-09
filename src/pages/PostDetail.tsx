import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUp, MessageCircle, Share, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import ZapButton from "@/components/ZapButton";
import { toast } from "sonner";

const PostDetail = () => {
  const { id } = useParams();
  const [comment, setComment] = useState("");
  const [postSats, setPostSats] = useState(3677);
  const [hasVoted, setHasVoted] = useState(false);

  const handleZap = (amount: number) => {
    setPostSats(prev => prev + amount);
  };

  const handleVote = () => {
    if (!hasVoted) {
      setPostSats(prev => prev + 10);
      setHasVoted(true);
      toast.success("Upvoted! +10 sats");
    }
  };

  const handleComment = () => {
    if (comment.trim()) {
      toast.success("Comment posted!");
      setComment("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link 
            to="/" 
            className="flex items-center text-sn-text-muted hover:text-sn-red transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to feed
          </Link>
          
          <div className="bg-card border border-sn-border rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 ${hasVoted ? 'text-sn-red' : 'text-sn-gray hover:text-sn-red'}`}
                  onClick={handleVote}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
                <span className="text-sm font-medium text-sn-text-muted">
                  {postSats.toLocaleString()}
                </span>
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Wasabi Wallet v2.7.0 released | Privacy wallet for Bitcoin only
                </h1>
                
                <div className="flex items-center space-x-3 text-sm text-sn-text-muted mb-4">
                  <span>by <strong className="text-foreground">@kruw</strong></span>
                  <span>•</span>
                  <span>1 Sep 2025</span>
                  <span>•</span>
                  <Badge variant="secondary" className="bg-sn-light-gray">bitcoin</Badge>
                  <Badge className="bg-sn-red text-white">top boost</Badge>
                </div>
                
                <div className="prose max-w-none mb-6">
                  <p className="text-foreground leading-relaxed">
                    Wasabi Wallet v2.7.0 has been released with significant improvements to privacy and user experience. 
                    This update includes enhanced coinjoin coordination, improved fee estimation, and better wallet synchronization.
                  </p>
                  <p className="text-foreground leading-relaxed mt-4">
                    Key features in this release:
                  </p>
                  <ul className="list-disc list-inside text-foreground space-y-1 mt-2">
                    <li>Enhanced privacy with improved coinjoin mixing</li>
                    <li>Better fee estimation algorithms</li>
                    <li>Faster wallet synchronization</li>
                    <li>UI/UX improvements across the board</li>
                  </ul>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <ZapButton 
                    postId={parseInt(id || "0")} 
                    currentSats={postSats} 
                    onZap={handleZap} 
                  />
                  <Button variant="outline" size="sm" className="border-sn-border">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Comments Section */}
        <div className="bg-card border border-sn-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Comments (16)
          </h2>
          
          <div className="mb-6">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mb-3 border-sn-border focus:border-sn-red"
            />
            <Button 
              onClick={handleComment}
              className="bg-sn-red hover:bg-sn-red-hover text-white"
            >
              Post Comment
            </Button>
          </div>
          
          {/* Sample Comments */}
          <div className="space-y-4">
            <div className="border-l-2 border-sn-red pl-4">
              <div className="flex items-center space-x-2 text-sm text-sn-text-muted mb-2">
                <strong className="text-foreground">@bitcoiner123</strong>
                <span>•</span>
                <span>2h ago</span>
              </div>
              <p className="text-foreground">
                Great update! The new coinjoin features are working perfectly. Privacy is getting better with each release.
              </p>
            </div>
            
            <div className="border-l-2 border-sn-border pl-4">
              <div className="flex items-center space-x-2 text-sm text-sn-text-muted mb-2">
                <strong className="text-foreground">@privacyfirst</strong>
                <span>•</span>
                <span>4h ago</span>
              </div>
              <p className="text-foreground">
                The fee estimation improvements are noticeable. Much more accurate now!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;