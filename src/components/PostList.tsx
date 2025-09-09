import PostItem from "./PostItem";
import { useState } from "react";

const mockPosts = [
  {
    id: 1202637,
    title: "Wasabi Wallet v2.7.0 released | Privacy wallet for Bitcoin only",
    url: "https://wasabiwallet.io/",
    sats: 3677,
    boost: "200k",
    comments: 16,
    author: "kruw",
    timeAgo: "1 Sep",
    category: "bitcoin",
    isTopBoost: true
  },
  {
    id: 1213026,
    title: "Your wildest drunk story?",
    sats: 1058,
    comments: 41,
    author: "ek",
    timeAgo: "15h",
    category: "AskSN"
  },
  {
    id: 1212941,
    title: "Stacker News Fiction Month Grand Prize Winner",
    sats: 2083,
    comments: 27,
    author: "Scoresby",
    timeAgo: "16h",
    category: "BooksAndArticles"
  },
  {
    id: 1213901,
    title: "TheAuditor Tool: Antidote to VibeCoding",
    url: "https://github.com/TheAuditorTool/Auditor",
    sats: 111,
    comments: 0,
    author: "RideandSmile",
    timeAgo: "27m",
    category: "AI"
  },
  {
    id: 1213063,
    title: "We Just Found Malicious Code in the Popular NPM Package",
    url: "https://jdstaerk.substack.com/p/we-just-found-malicious-code-in-the",
    sats: 1387,
    comments: 17,
    author: "kristapsk",
    timeAgo: "13h",
    category: "security"
  },
  {
    id: 1213000,
    title: "Gold was used for persistent data storage too",
    sats: 4683,
    comments: 30,
    author: "SimpleStacker",
    timeAgo: "17h",
    category: "bitcoin"
  },
  {
    id: 1212988,
    title: "Murch and Chris have a conversation - What is Going on Here???",
    sats: 2382,
    comments: 51,
    author: "028559d218",
    timeAgo: "8 Sep",
    category: "bitcoin"
  }
];

const PostList = () => {
  const [posts, setPosts] = useState(mockPosts);

  const handleZap = (postId: number, amount: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, sats: post.sats + amount }
        : post
    ));
  };

  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="bg-sn-light-gray text-center py-2 text-sm text-sn-text-muted">
          pull down to refresh
        </div>
        
        <div className="bg-background px-4">
          {posts.map((post) => (
            <PostItem
              key={post.id}
              id={post.id}
              title={post.title}
              url={post.url}
              sats={post.sats}
              boost={post.boost}
              comments={post.comments}
              author={post.author}
              timeAgo={post.timeAgo}
              category={post.category}
              isTopBoost={post.isTopBoost}
              onZap={handleZap}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostList;