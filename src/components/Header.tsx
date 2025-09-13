import { Search, User, Bell, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSearch } from "@/hooks/useSearch";
import { useState, useRef, useEffect } from "react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const { results, loading, query, searchPosts, clearSearch } = useSearch();
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.trim()) {
      searchPosts(value);
      setShowResults(true);
    } else {
      clearSearch();
      setShowResults(false);
    }
  };

  // Handle clicking outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
    setShowResults(false);
  };

  const navItems = [
    { path: "/", label: "hot" },
    { path: "/recent", label: "recent" },
    { path: "/random", label: "random" },
    { path: "/top", label: "top" },
  ];

  return (
    <header className="border-b border-sn-border bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-foreground hover:text-sn-red transition-colors">
              SN
            </Link>
            <div className="text-sm text-sn-text-muted">$112960</div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-sn-red transition-colors">home</Link>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`transition-colors ${
                  currentPath === item.path
                    ? 'text-sn-red font-medium'
                    : 'text-sn-text-muted hover:text-sn-red'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search and User Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sn-text-muted" />
              <Input 
                placeholder="search posts..." 
                className="pl-10 pr-8 w-64 border-sn-border focus:border-sn-red"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowResults(!!query)}
              />
              {searchTerm && (
                <X 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sn-text-muted cursor-pointer hover:text-sn-red" 
                  onClick={handleClearSearch}
                />
              )}
              
              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-sn-border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
                  {loading && (
                    <div className="p-4 text-center text-sn-text-muted">
                      Searching...
                    </div>
                  )}
                  {!loading && results.length === 0 && query && (
                    <div className="p-4 text-center text-sn-text-muted">
                      No results found for "{query}"
                    </div>
                  )}
                  {!loading && results.length > 0 && (
                    <>
                      <div className="p-2 text-xs text-sn-text-muted border-b border-sn-border">
                        {results.length} result{results.length !== 1 ? 's' : ''} found
                      </div>
                      {results.map((result) => (
                        <Link
                          key={result.id}
                          to={`/post/${result.id}`}
                          className="block p-3 hover:bg-sn-surface-muted border-b border-sn-border last:border-b-0"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium text-sm text-foreground line-clamp-1">
                            {result.title}
                          </div>
                          <div className="text-xs text-sn-text-muted mt-1 flex items-center space-x-2">
                            <span className="bg-sn-red/10 text-sn-red px-2 py-0.5 rounded text-xs">
                              {result.category}
                            </span>
                            <span>•</span>
                            <span>by @{result.profile?.username || 'unknown'}</span>
                            <span>•</span>
                            <span>{result.total_sats} sats</span>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            
            {user ? (
              <>
                <Button 
                  variant="default" 
                  className="bg-sn-red hover:bg-sn-red-hover text-white font-medium px-6"
                  onClick={() => navigate("/create")}
                >
                  post
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-sn-text-muted hover:text-sn-red cursor-pointer" />
                  <Link to="/profile" className="flex items-center space-x-1 hover:text-sn-red transition-colors">
                    <User className="h-5 w-5 text-sn-text-muted" />
                    <span className="text-sm text-sn-text-muted">@{user.email?.split('@')[0]}</span>
                    <div className="w-4 h-4 bg-sn-red rounded text-white text-xs flex items-center justify-center">⚡</div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="text-sn-text-muted hover:text-sn-red"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                variant="default" 
                className="bg-sn-red hover:bg-sn-red-hover text-white font-medium px-6"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;