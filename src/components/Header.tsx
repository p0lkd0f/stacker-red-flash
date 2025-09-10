import { Search, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useNostr } from "@/contexts/NostrContext";
import { useState } from "react";
import NostrLogin from "./NostrLogin";
import ProfileSetup from "./ProfileSetup";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useNostr();
  const [showLogin, setShowLogin] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const currentPath = location.pathname;

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
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sn-text-muted" />
              <Input 
                placeholder="search" 
                className="pl-10 w-48 border-sn-border focus:border-sn-red"
              />
            </div>
            
            <Button 
              variant="default" 
              className="bg-sn-red hover:bg-sn-red-hover text-white font-medium px-6"
              onClick={() => navigate("/create")}
              disabled={!isAuthenticated}
            >
              post
            </Button>
            
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-sn-text-muted hover:text-sn-red cursor-pointer" />
              
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 hover:text-sn-red transition-colors">
                      <User className="h-5 w-5 text-sn-text-muted" />
                      <span className="text-sm text-sn-text-muted">
                        {user?.npub?.slice(0, 8)}...
                      </span>
                      <div className="w-4 h-4 bg-sn-red rounded text-white text-xs flex items-center justify-center">⚡</div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowProfileSetup(true)}>
                      Lightning Setup
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowLogin(true)}
                  className="flex items-center space-x-1 hover:text-sn-red transition-colors"
                >
                  <User className="h-5 w-5 text-sn-text-muted" />
                  <span className="text-sm text-sn-text-muted">Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <NostrLogin open={showLogin} onOpenChange={setShowLogin} />
      <ProfileSetup open={showProfileSetup} onOpenChange={setShowProfileSetup} />
    </header>
  );
};

export default Header;