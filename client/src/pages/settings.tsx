import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/providers/ThemeProvider";
import { useWalletContext } from "@/providers/WalletProvider";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, User, Shield, Bell, Wallet } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { connected, address } = useWalletContext();
  const [loading, setLoading] = useState(false);

  // Mock function to simulate saving settings
  const handleSave = () => {
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
      });
    }, 1000);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 overflow-hidden">
        <div className="flex items-center p-6 bg-primary/10">
          <SettingsIcon className="w-10 h-10 text-primary mr-4" />
          <div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">User Settings</h3>
            <p className="text-gray-500 dark:text-gray-400">Customize your account preferences and application settings</p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-full md:max-w-xl">
          <TabsTrigger value="account" className="flex items-center justify-center">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center justify-center">
            <Wallet className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Wallet</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center justify-center">
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account profile and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Demo User" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="demo@example.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input id="company" defaultValue="Demo Company" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={3} placeholder="Tell us about yourself or your business" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme">Dark Mode</Label>
                  <Switch 
                    id="theme" 
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
              <CardDescription>Configure your blockchain wallet settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-700">
                <h4 className="text-sm font-medium mb-2">Connected Wallet</h4>
                {connected ? (
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-100 dark:bg-green-900 p-1 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-sm font-mono">{address}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="bg-red-100 dark:bg-red-900 p-1 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                    <span className="text-sm">No wallet connected</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="default-wallet">Default Wallet</Label>
                  <Switch id="default-wallet" defaultChecked />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use this wallet as your default for all transactions
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-connect">Auto-Connect Wallet</Label>
                  <Switch id="auto-connect" defaultChecked />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically connect your wallet when you log in
                </p>
              </div>
              
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure your security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <Switch id="two-factor" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable two-factor authentication for added security
                </p>
              </div>
              
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive email notifications for important events
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Invoice Payments</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when invoices are paid
                    </p>
                  </div>
                  <Switch id="invoice-paid" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">New Invoices</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when you receive new invoices
                    </p>
                  </div>
                  <Switch id="new-invoices" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">Marketing Updates</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive marketing updates and newsletters
                    </p>
                  </div>
                  <Switch id="marketing" />
                </div>
              </div>
              
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
