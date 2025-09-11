import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowUp, MessageCircle, Share, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import ZapButton from "@/components/ZapButton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const PostDetail = () => {
  const { id } = useParams();
  const [comment, setComment] = useState("");
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (
              username,
              display_name
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching post:', error);
          toast.error('Failed to load post');
          return;
        }

        setPost(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleZap = (amount: number) => {
    if (post) {
      setPost(prev => ({ ...prev, total_sats: prev.total_sats + amount }));
    }
  };

  const handleVote = () => {
    if (!hasVoted) {
      if (post) {
        setPost(prev => ({ ...prev, total_sats: prev.total_sats + 10 }));
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-sn-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

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
                  {post?.total_sats?.toLocaleString() || 0}
                </span>
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {post?.title || 'Post not found'}
                </h1>
                
                <div className="flex items-center space-x-3 text-sm text-sn-text-muted mb-4">
                  <span>by <strong className="text-foreground">
                    @{post?.profiles?.username || post?.profiles?.display_name || 'anonymous'}
                  </strong></span>
                  <span>•</span>
                  <span>{post?.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}</span>
                  <span>•</span>
                  <Badge variant="secondary" className="bg-sn-light-gray">{post?.category}</Badge>
                  {post?.is_top_boost && (
                    <Badge className="bg-sn-red text-white">top boost</Badge>
                  )}
                </div>
                
                {post?.url && (
                  <div className="mb-4">
                    <a 
                      href={post.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sn-red hover:text-sn-red-hover underline"
                    >
                      {post.url}
                    </a>
                  </div>
                )}
                
                {post?.content && (
                  <div className="prose max-w-none mb-6">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 mb-6">
                  <ZapButton 
                    postId={id || "0"} 
                    currentSats={post?.total_sats || 0} 
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
            Comments ({post?.total_comments || 0})
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
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-sn-text-muted mx-auto mb-4" />
            <p className="text-sn-text-muted">
              {post?.total_comments === 0 
                ? "No comments yet. Be the first to comment!" 
                : "Comments will be loaded here."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;