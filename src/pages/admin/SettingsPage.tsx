import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Globe, 
  Mail, 
  Shield, 
  Database, 
  Image,
  Bell,
  Save,
  AlertCircle,
  HardDrive,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  contactEmail: string;
  adminEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  moderationRequired: boolean;
  maxFileSize: number;
  allowedFileTypes: string;
  backupFrequency: string;
  theme: string;
}

interface StorageStats {
  totalUsed: number;
  totalQuota: number;
  usagePercentage: number;
  breakdown: {
    images: number;
    videos: number;
    documents: number;
    other: number;
  };
  fileCount: {
    images: number;
    videos: number;
    documents: number;
    other: number;
  };
  isNearCapacity: boolean;
  isAtCapacity: boolean;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Francis Legacy',
    siteDescription: 'Preserving our family heritage for future generations',
    siteUrl: 'https://francislegacy.org',
    contactEmail: 'contact@francislegacy.com',
    adminEmail: 'admin@francislegacy.com',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    moderationRequired: true,
    maxFileSize: 10,
    allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx',
    backupFrequency: 'daily',
    theme: 'system'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call - in real implementation, you'd save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
      
      // Reset saved status after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SiteSettings, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Utility function to format bytes
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get storage status color
  const getStorageStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Fetch storage statistics
  const fetchStorageStats = async () => {
    setStorageLoading(true);
    try {
      const stats = await apiClient.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to fetch storage stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load storage statistics',
        variant: 'destructive',
      });
    } finally {
      setStorageLoading(false);
    }
  };

  // Load storage stats on component mount
  useEffect(() => {
    fetchStorageStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h2>
          <p className="text-gray-600">Configure your Francis Legacy website</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {saved && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All changes have been saved successfully.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Site Information
              </CardTitle>
              <CardDescription>
                Basic information about your family website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input
                  id="siteUrl"
                  value={settings.siteUrl}
                  onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site Features</CardTitle>
              <CardDescription>
                Control which features are available on your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <div className="text-sm text-gray-500">
                    Temporarily disable public access to the site
                  </div>
                </div>
                <Switch
                  id="maintenance"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="registration">User Registration</Label>
                  <div className="text-sm text-gray-500">
                    Allow new family members to register accounts
                  </div>
                </div>
                <Switch
                  id="registration"
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => handleInputChange('registrationEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure email settings for notifications and communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Send email notifications for important events
                  </div>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="moderation">Content Moderation</Label>
                  <div className="text-sm text-gray-500">
                    Require admin approval for user submissions
                  </div>
                </div>
                <Switch
                  id="moderation"
                  checked={settings.moderationRequired}
                  onCheckedChange={(checked) => handleInputChange('moderationRequired', checked)}
                />
              </div>

              <Separator />

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security features like two-factor authentication and password policies 
                  can be configured in the user management section.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Media Settings
              </CardTitle>
              <CardDescription>
                Configure file upload and media handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => handleInputChange('maxFileSize', parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedTypes">Allowed File Types</Label>
                <Input
                  id="allowedTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => handleInputChange('allowedFileTypes', e.target.value)}
                  placeholder="jpg,png,pdf,doc"
                />
                <div className="text-sm text-gray-500">
                  Comma-separated list of allowed file extensions
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Capacity
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStorageStats}
                  disabled={storageLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${storageLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Current storage usage and capacity limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storageLoading ? (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading storage statistics...</span>
                </div>
              ) : storageStats ? (
                <>
                  {/* Storage Warning Alert */}
                  {storageStats.isNearCapacity && (
                    <Alert className={`border-l-4 ${storageStats.isAtCapacity ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                      <AlertCircle className={`h-4 w-4 ${storageStats.isAtCapacity ? 'text-red-600' : 'text-yellow-600'}`} />
                      <AlertDescription className={storageStats.isAtCapacity ? 'text-red-800' : 'text-yellow-800'}>
                        {storageStats.isAtCapacity 
                          ? 'Storage capacity is nearly full! New uploads may be disabled.'
                          : 'Storage capacity is approaching the limit. Consider reviewing and managing files.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Storage Usage</Label>
                      <span className="text-sm font-medium">{storageStats.usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={storageStats.usagePercentage} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{formatBytes(storageStats.totalUsed)} used</span>
                      <span>{formatBytes(storageStats.totalQuota)} total</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Storage Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <Label>Storage Breakdown</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Images</span>
                          <span className="text-sm font-medium">{formatBytes(storageStats.breakdown.images)}</span>
                        </div>
                        <div className="text-xs text-gray-500">{storageStats.fileCount.images} files</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Videos</span>
                          <span className="text-sm font-medium">{formatBytes(storageStats.breakdown.videos)}</span>
                        </div>
                        <div className="text-xs text-gray-500">{storageStats.fileCount.videos} files</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Documents</span>
                          <span className="text-sm font-medium">{formatBytes(storageStats.breakdown.documents)}</span>
                        </div>
                        <div className="text-xs text-gray-500">{storageStats.fileCount.documents} files</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Other</span>
                          <span className="text-sm font-medium">{formatBytes(storageStats.breakdown.other)}</span>
                        </div>
                        <div className="text-xs text-gray-500">{storageStats.fileCount.other} files</div>
                      </div>
                    </div>
                  </div>

                  {/* Storage Info */}
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>• Storage quota can be configured via environment variables</div>
                      <div>• Only published archive items are counted towards usage</div>
                      <div>• Statistics are updated in real-time when files are uploaded or deleted</div>
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Unable to load storage statistics. Please try refreshing or contact support if the issue persists.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Advanced configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select 
                  value={settings.backupFrequency} 
                  onValueChange={(value) => handleInputChange('backupFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select backup frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Default Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => handleInputChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Advanced settings may require technical knowledge. 
                  Contact support if you need assistance with these options.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;