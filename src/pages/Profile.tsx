import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings, Zap, MessageCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import EditProfileModal from "@/components/EditProfileModal";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";

const Profile = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetchProfile } = useProfile();
  const { posts, loading: postsLoading } = usePosts();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter posts by current user
  const userPosts = posts.filter(post => post.author_id === user?.id);

  if (profileLoading || postsLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-sn-red border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            to="/" 
            className="flex items-center text-sn-text-muted hover:text-sn-red transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to feed
          </Link>
          
          {/* Profile Header */}
          <div className="bg-card border border-sn-border rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-sn-red rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(profile?.display_name || profile?.username || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    @{profile?.username || user?.email?.split('@')[0] || 'user'}
                  </h1>
                  <p className="text-sn-text-muted">
                    {profile?.bio || 'New to Stacker News'}
                  </p>
                  {profile?.lightning_address && (
                    <div className="flex items-center space-x-1 mt-2">
                      <Zap className="h-4 w-4 text-sn-red" />
                      <span className="text-sm text-sn-text-muted">
                        Lightning Address: {profile.lightning_address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-sn-border"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Link to="/settings">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-sn-border"
                  >
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-sn-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-sn-red">
                  {(profile?.total_sats_earned || 0).toLocaleString()}
                </div>
                <div className="text-sm text-sn-text-muted">Sats Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {userPosts.length}
                </div>
                <div className="text-sm text-sn-text-muted">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {profile?.total_followers || 0}
                </div>
                <div className="text-sm text-sn-text-muted">Followers</div>
              </div>
            </div>
          </div>
          
          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-sn-light-gray">
              <TabsTrigger value="posts" className="data-[state=active]:bg-sn-red data-[state=active]:text-white">
                Posts
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-sn-red data-[state=active]:text-white">
                Comments
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-sn-red data-[state=active]:text-white">
                Activity
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-6">
              <div className="bg-card border border-sn-border rounded-lg">
                {userPosts.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sn-text-muted">No posts yet. Create your first post!</p>
                    <Link to="/create">
                      <Button className="mt-4 bg-sn-red hover:bg-sn-red-hover text-white">
                        Create Post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  userPosts.map((post, index) => (
                    <div key={post.id} className={`p-4 ${index > 0 ? 'border-t border-sn-border' : ''}`}>
                      <Link to={`/post/${post.id}`}>
                        <h3 className="font-medium text-foreground hover:text-sn-red cursor-pointer mb-2">
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex items-center space-x-3 text-sm text-sn-text-muted">
                        <span className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{post.total_sats || 0} sats</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{post.total_comments || 0} comments</span>
                        </span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <Badge variant="secondary" className="bg-sn-light-gray">
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="comments" className="mt-6">
              <div className="bg-card border border-sn-border rounded-lg p-6 text-center">
                <MessageCircle className="h-12 w-12 text-sn-red mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Comments</h3>
                <p className="text-sn-text-muted">
                  Your comments on posts will appear here.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <div className="bg-card border border-sn-border rounded-lg p-6 text-center">
                <Zap className="h-12 w-12 text-sn-red mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Recent Activity</h3>
                <p className="text-sn-text-muted">
                  Your zaps, votes, and interactions will appear here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <EditProfileModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            profile={profile}
            onProfileUpdated={refetchProfile}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;