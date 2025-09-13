import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: {
    username?: string;
    display_name?: string;
    bio?: string;
    lightning_address?: string;
  };
  onProfileUpdated?: () => void;
}

const EditProfileModal = ({ open, onOpenChange, profile, onProfileUpdated }: EditProfileModalProps) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [lightningAddress, setLightningAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setUsername(profile.username || '');
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLightningAddress(profile.lightning_address || '');
    }
  }, [open, profile]);

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to edit your profile");
      return;
    }

    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          display_name: displayName.trim() || username.trim(),
          bio: bio.trim() || null,
          lightning_address: lightningAddress.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      onProfileUpdated?.();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      if (error.code === '23505') {
        toast.error("Username already taken. Please choose a different one.");
      } else {
        toast.error(error.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lightningAddress">Lightning Address</Label>
            <Input
              id="lightningAddress"
              value={lightningAddress}
              onChange={(e) => setLightningAddress(e.target.value)}
              placeholder="user@domain.com"
              disabled={loading}
            />
            <p className="text-xs text-sn-text-muted">
              Optional: Your Lightning address for receiving payments
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;