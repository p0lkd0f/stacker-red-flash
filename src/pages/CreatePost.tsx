import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usePosts } from "@/hooks/usePosts";
import { toast } from "sonner";

const CreatePost = () => {
  const navigate = useNavigate();
  const { createPost } = usePosts();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: "web-app", label: "Web Application Security" },
    { value: "mobile", label: "Mobile Security" },
    { value: "api", label: "API Security" },
    { value: "cloud", label: "Cloud Security" },
    { value: "network", label: "Network Security" },
    { value: "crypto", label: "Cryptography" },
    { value: "osint", label: "OSINT" },
    { value: "social-eng", label: "Social Engineering" },
    { value: "hardware", label: "Hardware Security" },
    { value: "reverse-eng", label: "Reverse Engineering" },
    { value: "malware", label: "Malware Analysis" },
    { value: "physical", label: "Physical Security" }
  ];

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!title.trim()) {
        toast.error("Title is required");
        return;
      }

      if (!category) {
        toast.error("Please select a category");
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await createPost({
          title: title.trim(),
          url: url.trim() || undefined,
          content: text.trim() || undefined,
          category,
        });

        if (result) {
          navigate("/");
        }
      } catch (error) {
        toast.error("Failed to create post");
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link 
          to="/" 
          className="flex items-center text-sn-text-muted hover:text-sn-red transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to feed
        </Link>
        
        <div className="bg-card border border-sn-border rounded-lg p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Create New Post</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-foreground font-medium">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your post title..."
                className="mt-2 border-sn-border focus:border-sn-red"
                maxLength={200}
              />
              <p className="text-xs text-sn-text-muted mt-1">
                {title.length}/200 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="url" className="text-foreground font-medium">
                URL (optional)
              </Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="mt-2 border-sn-border focus:border-sn-red"
              />
            </div>
            
            <div>
              <Label htmlFor="category" className="text-foreground font-medium">
                Category *
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2 border-sn-border focus:border-sn-red">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="text" className="text-foreground font-medium">
                Text (optional)
              </Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your post content here..."
                className="mt-2 min-h-[120px] border-sn-border focus:border-sn-red"
                maxLength={2000}
              />
              <p className="text-xs text-sn-text-muted mt-1">
                {text.length}/2000 characters
              </p>
            </div>
            
            <div className="bg-sn-light-gray border border-sn-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">💡 Posting Tips</h3>
              <ul className="text-sm text-sn-text-muted space-y-1">
                <li>• Use descriptive titles that clearly explain your post</li>
                <li>• Choose the most relevant category for better discovery</li>
                <li>• Quality content gets more sats and engagement</li>
                <li>• Include sources and references when possible</li>
              </ul>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-sn-border">
              <div className="text-sm text-sn-text-muted">
                Posting costs: <strong className="text-foreground">10 sats</strong>
              </div>
              
              <div className="space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/")}
                  className="border-sn-border"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-sn-red hover:bg-sn-red-hover text-white"
                >
                  {isSubmitting ? "Publishing..." : "Publish Post"}
                </Button>
              </div>
            </div>
          </form>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CreatePost;