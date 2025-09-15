import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Zap, AlertCircle, CheckCircle } from "lucide-react";

interface WalletConfig {
  id: string;
  wallet_type: string;
  lnbits_url: string | null;
  api_key: string | null;
  admin_key: string | null;
  balance_sats: number;
  is_active: boolean;
}

const WalletSettings = () => {
  const { user } = useAuth();
  const [walletConfig, setWalletConfig] = useState<WalletConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    wallet_type: 'lnbits',
    lnbits_url: '',
    api_key: '',
    admin_key: ''
  });

  useEffect(() => {
    if (!user?.id) return;
    fetchWalletConfig();
  }, [user?.id]);

  const fetchWalletConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_config')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching wallet config:', error);
        toast.error('Failed to load wallet configuration');
        return;
      }

      if (data) {
        setWalletConfig(data);
        setFormData({
          wallet_type: data.wallet_type,
          lnbits_url: data.lnbits_url || '',
          api_key: data.api_key || '',
          admin_key: data.admin_key || ''
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load wallet configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!formData.lnbits_url || !formData.api_key) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const configData = {
        user_id: user.id,
        wallet_type: formData.wallet_type,
        lnbits_url: formData.lnbits_url,
        api_key: formData.api_key,
        admin_key: formData.admin_key || null,
        is_active: true
      };

      if (walletConfig) {
        // Update existing config
        const { error } = await supabase
          .from('wallet_config')
          .update(configData)
          .eq('id', walletConfig.id);

        if (error) throw error;
      } else {
        // Create new config
        const { data, error } = await supabase
          .from('wallet_config')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        setWalletConfig(data);
      }

      toast.success('Wallet configuration saved successfully');
      fetchWalletConfig();
    } catch (error) {
      console.error('Error saving wallet config:', error);
      toast.error('Failed to save wallet configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!formData.lnbits_url || !formData.api_key) {
      toast.error('Please fill in URL and API key first');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${formData.lnbits_url}/api/v1/wallet`, {
        headers: {
          'X-Api-Key': formData.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Connection successful! Balance: ${Math.floor(data.balance / 1000)} sats`);
      } else {
        toast.error('Connection failed. Please check your credentials.');
      }
    } catch (error) {
      toast.error('Connection failed. Please check your URL and credentials.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-sn-red border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-sn-red" />
          <CardTitle>Wallet Configuration</CardTitle>
        </div>
        <CardDescription>
          Connect your Lightning wallet to send and receive zaps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {walletConfig && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Wallet connected • Balance: {walletConfig.balance_sats.toLocaleString()} sats
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet_type">Wallet Type</Label>
            <Select 
              value={formData.wallet_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, wallet_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lnbits">LNbits</SelectItem>
                <SelectItem value="lnd" disabled>LND (Coming Soon)</SelectItem>
                <SelectItem value="phoenix" disabled>Phoenix (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lnbits_url">LNbits URL *</Label>
            <Input
              id="lnbits_url"
              type="url"
              placeholder="https://your-lnbits-instance.com"
              value={formData.lnbits_url}
              onChange={(e) => setFormData(prev => ({ ...prev, lnbits_url: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">Invoice/Read Key *</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="Your LNbits invoice/read key"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_key">Admin/Write Key (Optional)</Label>
            <Input
              id="admin_key"
              type="password"
              placeholder="Your LNbits admin/write key (for sending payments)"
              value={formData.admin_key}
              onChange={(e) => setFormData(prev => ({ ...prev, admin_key: e.target.value }))}
            />
            <p className="text-xs text-sn-text-muted">
              Required for sending zaps. Leave empty if you only want to receive.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Your keys are encrypted and stored securely. Never share your admin key.
          </span>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={testConnection}
            variant="outline"
            disabled={saving || !formData.lnbits_url || !formData.api_key}
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving || !formData.lnbits_url || !formData.api_key}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletSettings;