import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNostr } from '@/contexts/NostrContext';
import { Zap, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ open, onOpenChange }) => {
  const { user, updateProfile } = useNostr();
  const [lightningAddress, setLightningAddress] = useState(user?.lightningAddress || '');
  const [nwcUri, setNwcUri] = useState(user?.nwcUri || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        lightningAddress: lightningAddress.trim() || undefined,
        nwcUri: nwcUri.trim() || undefined
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-sn-red" />
            Setup Lightning Profile
          </DialogTitle>
          <DialogDescription>
            Configure your Lightning address and wallet connection to receive zaps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lightningAddress" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Lightning Address
            </Label>
            <Input
              id="lightningAddress"
              type="email"
              value={lightningAddress}
              onChange={(e) => setLightningAddress(e.target.value)}
              placeholder="username@domain.com"
              className="border-sn-border focus:border-sn-red"
            />
            <p className="text-xs text-muted-foreground">
              Your Lightning address where you'll receive zaps (e.g., user@getalby.com)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nwcUri">Nostr Wallet Connect URI</Label>
            <Input
              id="nwcUri"
              type="password"
              value={nwcUri}
              onChange={(e) => setNwcUri(e.target.value)}
              placeholder="nostr+walletconnect://..."
              className="border-sn-border focus:border-sn-red"
            />
            <p className="text-xs text-muted-foreground">
              Your NWC connection string for sending zaps (from Alby, etc.)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-medium text-blue-800 mb-1">💡 How to get these:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Lightning Address: Get one from Alby, Strike, or other providers</li>
              <li>• NWC URI: Generate from your Lightning wallet's settings</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-sn-red hover:bg-sn-red-hover"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetup;