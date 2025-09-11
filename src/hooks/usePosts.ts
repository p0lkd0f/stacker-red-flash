import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  url: string | null;
  content: string | null;
  category: string;
  author_id: string;
  total_sats: number;
  total_comments: number;
  boost_amount: number;
  is_top_boost: boolean;
  created_at: string;
  profiles: {
    username: string | null;
    display_name: string | null;
  } | null;
}

export const usePosts = (sortType: string = 'hot') => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let query = supabase
          .from('posts')
          .select(`
            *,
            profiles (
              username,
              display_name
            )
          `);

        // Apply sorting
        switch (sortType) {
          case 'recent':
            query = query.order('created_at', { ascending: false });
            break;
          case 'top':
            query = query.order('total_sats', { ascending: false });
            break;
          case 'random':
            // PostgreSQL random() function
            query = query.order('created_at', { ascending: false }); // Fallback to recent for now
            break;
          case 'hot':
          default:
            // Hot algorithm: recent posts with high engagement
            query = query.order('total_sats', { ascending: false });
            break;
        }

        const { data, error } = await query.limit(50);

        if (error) {
          console.error('Error fetching posts:', error);
          toast.error('Failed to load posts');
          return;
        }

        setPosts((data as unknown as Post[]) || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [sortType]);

  const updatePostSats = (postId: string, amount: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, total_sats: post.total_sats + amount }
        : post
    ));
  };

  const createPost = async (postData: {
    title: string;
    url?: string;
    content?: string;
    category: string;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        toast.error('You must be logged in to create a post');
        return null;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...postData,
          author_id: userData.user.id
        }])
        .select(`
          *,
          profiles (
            username,
            display_name
          )
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
        return null;
      }

      setPosts(prev => [data as unknown as Post, ...prev]);
      toast.success('Post created successfully!');
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create post');
      return null;
    }
  };

  return { posts, loading, updatePostSats, createPost };
};