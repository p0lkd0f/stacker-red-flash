import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings, Zap, MessageCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";

const Profile = () => {
  const [followersCount] = useState(247);
  const [satsEarned] = useState(15420);
  const [postsCount] = useState(23);

  const userPosts = [
    {
      id: 1,
      title: "Why Lightning Network is the future of Bitcoin payments",
      sats: 1250,
      comments: 15,
      timeAgo: "2d ago",
      category: "bitcoin"
    },
    {
      id: 2,
      title: "Setting up your first Bitcoin Lightning node",
      sats: 890,
      comments: 8,
      timeAgo: "5d ago",
      category: "tech"
    }
  ];

  const userComments = [
    {
      id: 1,
      postTitle: "Wasabi Wallet v2.7.0 released",
      comment: "Great update! The new coinjoin features are working perfectly.",
      sats: 50,
      timeAgo: "1h ago"
    },
    {
      id: 2,
      postTitle: "Your wildest drunk story?",
      comment: "This reminds me of a conference in Miami...",
      sats: 25,
      timeAgo: "3h ago"
    }
  ];

  return (
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
                A
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">@anon</h1>
                <p className="text-sn-text-muted">Stacking sats since 2021</p>
                <div className="flex items-center space-x-1 mt-2">
                  <Zap className="h-4 w-4 text-sn-red" />
                  <span className="text-sm text-sn-text-muted">Lightning Address: anon@stacker.news</span>
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="border-sn-border">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-sn-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-sn-red">{satsEarned.toLocaleString()}</div>
              <div className="text-sm text-sn-text-muted">Sats Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{postsCount}</div>
              <div className="text-sm text-sn-text-muted">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{followersCount}</div>
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
              {userPosts.map((post, index) => (
                <div key={post.id} className={`p-4 ${index > 0 ? 'border-t border-sn-border' : ''}`}>
                  <h3 className="font-medium text-foreground hover:text-sn-red cursor-pointer mb-2">
                    {post.title}
                  </h3>
                  <div className="flex items-center space-x-3 text-sm text-sn-text-muted">
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{post.sats} sats</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.comments} comments</span>
                    </span>
                    <span>{post.timeAgo}</span>
                    <Badge variant="secondary" className="bg-sn-light-gray">
                      {post.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="comments" className="mt-6">
            <div className="bg-card border border-sn-border rounded-lg">
              {userComments.map((comment, index) => (
                <div key={comment.id} className={`p-4 ${index > 0 ? 'border-t border-sn-border' : ''}`}>
                  <div className="text-sm text-sn-text-muted mb-2">
                    Comment on: <span className="text-foreground font-medium">{comment.postTitle}</span>
                  </div>
                  <p className="text-foreground mb-2">{comment.comment}</p>
                  <div className="flex items-center space-x-3 text-sm text-sn-text-muted">
                    <span className="flex items-center space-x-1">
                      <Zap className="h-3 w-3 text-sn-red" />
                      <span>{comment.sats} sats</span>
                    </span>
                    <span>{comment.timeAgo}</span>
                  </div>
                </div>
              ))}
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
      </div>
    </div>
  );
};

export default Profile;