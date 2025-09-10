import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNostr } from '@/contexts/NostrContext';
import { Copy, Eye, EyeOff, Key, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface NostrLoginProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NostrLogin: React.FC<NostrLoginProps> = ({ open, onOpenChange }) => {
  const { login, generateNewAccount, isLoading } = useNostr();
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [newAccount, setNewAccount] = useState<any>(null);

  const handleLogin = async () => {
    if (!secretKey.trim()) {
      toast.error('Please enter your secret key');
      return;
    }

    try {
      await login(secretKey);
      onOpenChange(false);
      setSecretKey('');
    } catch (error) {
      // Error is handled in the context
    }
  };

  const handleGenerateAccount = () => {
    const account = generateNewAccount();
    setNewAccount(account);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleFinishSetup = () => {
    onOpenChange(false);
    setNewAccount(null);
    setSecretKey('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sn-red" />
            Connect with Nostr
          </DialogTitle>
          <DialogDescription>
            Connect your Nostr identity to start earning sats from your posts and comments.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="create">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key (nsec or hex)</Label>
              <div className="relative">
                <Input
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="nsec1... or hex string"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleLogin} 
              disabled={isLoading || !secretKey.trim()}
              className="w-full bg-sn-red hover:bg-sn-red-hover"
            >
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>

            <div className="text-xs text-muted-foreground">
              <p>Your secret key is stored locally and never sent to our servers.</p>
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            {!newAccount ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Generate a new Nostr keypair to get started. Make sure to save your secret key safely!
                  </p>
                </div>
                
                <Button 
                  onClick={handleGenerateAccount}
                  className="w-full bg-sn-red hover:bg-sn-red-hover"
                >
                  Generate New Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important: Save Your Keys</h4>
                  <p className="text-sm text-yellow-700">
                    Store these keys safely. You'll need the secret key to access your account.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Public Key (npub)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={newAccount.npub} 
                        readOnly 
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(newAccount.npub, 'Public key')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Secret Key (nsec)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={Array.from(newAccount.secretKey).map((b: number) => b.toString(16).padStart(2, '0')).join('')}
                        readOnly 
                        type={showSecretKey ? 'text' : 'password'}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                      >
                        {showSecretKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(
                          Array.from(newAccount.secretKey).map((b: number) => b.toString(16).padStart(2, '0')).join(''),
                          'Secret key'
                        )}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleFinishSetup}
                  className="w-full bg-sn-red hover:bg-sn-red-hover"
                >
                  I've Saved My Keys
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default NostrLogin;