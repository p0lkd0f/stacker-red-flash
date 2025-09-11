import PostItem from "./PostItem";
import { usePosts } from "@/hooks/usePosts";
import { formatDistanceToNow } from "date-fns";

interface PostListProps {
  sortType: string;
}

const PostList = ({ sortType }: PostListProps) => {
  const { posts, loading, updatePostSats } = usePosts(sortType);

  const handleZap = (postId: string, amount: number) => {
    updatePostSats(postId, amount);
  };

  if (loading) {
    return (
      <div className="bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="bg-sn-light-gray text-center py-2 text-sm text-sn-text-muted">
            Loading posts...
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-sn-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="bg-sn-light-gray text-center py-2 text-sm text-sn-text-muted">
          pull down to refresh
        </div>
        
        <div className="bg-background px-4" aria-live="polite">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sn-text-muted">No posts yet. Be the first to create one!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostItem
                key={post.id}
                id={post.id}
                title={post.title}
                url={post.url}
                sats={post.total_sats}
                boost={post.boost_amount > 0 ? `${post.boost_amount}k` : undefined}
                comments={post.total_comments}
                author={post.profiles?.username || post.profiles?.display_name || 'anonymous'}
                timeAgo={formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                category={post.category}
                isTopBoost={post.is_top_boost}
                onZap={handleZap}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostList;