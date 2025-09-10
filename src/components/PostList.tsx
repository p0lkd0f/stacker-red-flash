import { useState } from "react";
import PostItem from "./PostItem";

interface PostListProps {
  sortType: string;
}

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

const PostList = ({ sortType }: PostListProps) => {
  const [posts, setPosts] = useState(mockPosts);

  // Sort posts based on sortType
  const getSortedPosts = () => {
    switch (sortType) {
      case 'recent':
        return [...posts].sort((a, b) => b.id - a.id);
      case 'top':
        return [...posts].sort((a, b) => b.sats - a.sats);
      case 'random':
        return [...posts].sort(() => Math.random() - 0.5);
      case 'hot':
      default:
        return [...posts].sort((a, b) => (b.sats + b.comments * 50) - (a.sats + a.comments * 50));
    }
  };

  const handleZap = (postId: number, amount: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, sats: post.sats + amount }
        : post
    ));
  };

  const sortedPosts = getSortedPosts();

  return (
    <div className="bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="bg-sn-light-gray text-center py-2 text-sm text-sn-text-muted">
          pull down to refresh
        </div>
        
        <div className="bg-background px-4" aria-live="polite">
          {sortedPosts.map((post) => (
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