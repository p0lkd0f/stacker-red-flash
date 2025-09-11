import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Twitter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const { user, signIn, signUp, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if user is already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signUp(email, password, username);
    setLoading(false);
  };

  const handleTwitterAuth = async () => {
    setLoading(true);
    await signInWithOAuth('twitter');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-sn-red hover:text-sn-red-hover transition-colors flex items-center justify-center space-x-2">
            <Zap className="h-8 w-8" />
            <span>SN</span>
          </Link>
          <p className="text-sn-text-muted mt-2">Join the Lightning-powered community</p>
        </div>

        <Card className="border-sn-border">
          <CardHeader>
            <CardTitle className="text-foreground">Welcome</CardTitle>
            <CardDescription className="text-sn-text-muted">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-sn-light-gray">
                <TabsTrigger value="signin" className="data-[state=active]:bg-sn-red data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-sn-red data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-sn-border focus:border-sn-red"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-sn-border focus:border-sn-red"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-sn-red hover:bg-sn-red-hover" 
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      className="border-sn-border focus:border-sn-red"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-sn-border focus:border-sn-red"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="border-sn-border focus:border-sn-red"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-sn-red hover:bg-sn-red-hover" 
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-sn-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-sn-text-muted">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-sn-border hover:bg-sn-light-gray"
              onClick={handleTwitterAuth}
              disabled={loading}
            >
              <Twitter className="mr-2 h-4 w-4" />
              Twitter / X
            </Button>

            <div className="mt-6 text-center">
              <Link to="/" className="text-sm text-sn-text-muted hover:text-sn-red transition-colors">
                ← Back to feed
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;