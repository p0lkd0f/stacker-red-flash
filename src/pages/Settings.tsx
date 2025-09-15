import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import WalletSettings from "@/components/WalletSettings";
import EditProfileModal from "@/components/EditProfileModal";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";

const Settings = () => {
  const { profile, refetchProfile } = useProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            to="/" 
            className="flex items-center text-sn-text-muted hover:text-sn-red transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to feed
          </Link>
          
          <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
          
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-sn-light-gray">
              <TabsTrigger value="wallet" className="data-[state=active]:bg-sn-red data-[state=active]:text-white">
                Wallet
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:bg-sn-red data-[state=active]:text-white"
                onClick={() => setIsEditModalOpen(true)}
              >
                Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallet" className="mt-6">
              <WalletSettings />
            </TabsContent>
            
            <TabsContent value="profile" className="mt-6">
              <div className="text-center py-8 text-sn-text-muted">
                Profile settings will open in a modal
              </div>
            </TabsContent>
          </Tabs>
          
          <EditProfileModal
            open={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            profile={profile}
            onProfileUpdated={refetchProfile}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;