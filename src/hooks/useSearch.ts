import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SearchResult {
  id: string;
  title: string;
  url?: string;
  content?: string;
  category: string;
  author_id: string;
  total_sats: number;
  total_comments: number;
  boost_amount: number;
  is_top_boost: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    username: string;
    display_name: string;
  };
}

export const useSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const searchPosts = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setQuery('');
      return;
    }

    setLoading(true);
    setQuery(searchTerm);

    try {
      // Use the search function from database
      const { data: posts, error } = await supabase.rpc('search_posts', {
        search_term: searchTerm
      });

      if (error) throw error;

      if (posts && posts.length > 0) {
        // Get unique author IDs
        const authorIds = [...new Set(posts.map((post: any) => post.author_id))];
        
        // Fetch profiles for all authors
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', authorIds);

        if (profileError) throw profileError;

        // Map profiles to posts
        const postsWithProfiles = posts.map((post: any) => ({
          ...post,
          profile: profiles?.find(p => p.id === post.author_id)
        }));

        setResults(postsWithProfiles);
      } else {
        setResults([]);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search posts');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setResults([]);
    setQuery('');
  };

  return {
    results,
    loading,
    query,
    searchPosts,
    clearSearch
  };
};