import { Search, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="border-b border-sn-border bg-background">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-foreground">SN</div>
            <div className="text-sm text-sn-text-muted">$112960</div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button className="text-foreground hover:text-sn-red transition-colors">home</button>
            <button className="text-foreground hover:text-sn-red transition-colors">hot</button>
            <button className="text-sn-text-muted hover:text-sn-red transition-colors">recent</button>
            <button className="text-sn-text-muted hover:text-sn-red transition-colors">random</button>
            <button className="text-sn-text-muted hover:text-sn-red transition-colors">top</button>
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
            >
              post
            </Button>
            
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-sn-text-muted hover:text-sn-red cursor-pointer" />
              <div className="flex items-center space-x-1">
                <User className="h-5 w-5 text-sn-text-muted" />
                <span className="text-sm text-sn-text-muted">@anon</span>
                <div className="w-4 h-4 bg-sn-red rounded text-white text-xs flex items-center justify-center">⚡</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;