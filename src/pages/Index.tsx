import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import PostList from "@/components/PostList";

const Index = () => {
  const location = useLocation();
  const sortType = location.pathname.slice(1) || 'hot'; // default to 'hot', remove leading '/'

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PostList sortType={sortType} />
    </div>
  );
};

export default Index;
