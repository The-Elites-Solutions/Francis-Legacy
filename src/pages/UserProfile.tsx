import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

const UserProfile: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    maidenName: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    occupation: '',
    biography: '',
    profilePhotoUrl: ''
  });

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Initialize profile data when user loads
  useEffect(() => {
    if (user && user.userType === 'family_member') {
      // Fetch current member data to populate the form
      fetchMemberData();
    }
  }, [user]);

  const fetchMemberData = async () => {
    try {
      // We can get the member data via the family endpoint since we have the user ID
      const memberData = await apiClient.getFamilyMember(user.id);
      
      // Convert birth_date from ISO string to YYYY-MM-DD format for HTML date input
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      setProfileData({
        firstName: memberData.first_name || '',
        lastName: memberData.last_name || '',
        maidenName: memberData.maiden_name || '',
        gender: memberData.gender || '',
        birthDate: formatDateForInput(memberData.birth_date),
        birthPlace: memberData.birth_place || '',
        occupation: memberData.occupation || '',
        biography: memberData.biography || '',
        profilePhotoUrl: memberData.profile_photo_url || ''
      });
    } catch (error) {
      console.error('Error fetching member data:', error);
      // If we can't fetch, use basic user data
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        maidenName: '',
        gender: '',
        birthDate: '',
        birthPlace: '',
        occupation: '',
        biography: '',
        profilePhotoUrl: ''
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    // Validation
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long' });
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      setPasswordLoading(false);
      return;
    }

    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Refresh user data
      await checkAuth();
    } catch (err) {
      setPasswordMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to change password' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const clearMessages = () => {
    setMessage(null);
    setPasswordMessage(null);
  };

  const handleProfileEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleProfileCancel = () => {
    setIsEditing(false);
    // Reset to original data
    fetchMemberData();
    setMessage(null);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage(null);

    try {
      console.log('🔍 Profile Debug - Before profile update, user type:', user?.userType);
      const response = await apiClient.updateOwnProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Instead of calling checkAuth() which might cause session confusion,
      // let's just refresh the profile data locally from the API response
      console.log('🔍 Profile Debug - Profile updated successfully, refreshing local data only');
      if (response && response.member) {
        // Update profileData state with the returned member data
        const formatDateForInput = (dateString: string) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        setProfileData({
          firstName: response.member.first_name || '',
          lastName: response.member.last_name || '',
          maidenName: response.member.maiden_name || '',
          gender: response.member.gender || '',
          birthDate: formatDateForInput(response.member.birth_date),
          birthPlace: response.member.birth_place || '',
          occupation: response.member.occupation || '',
          biography: response.member.biography || '',
          profilePhotoUrl: response.member.profile_photo_url || ''
        });
        console.log('🔍 Profile Debug - Profile data refreshed locally without session re-auth');
      }
      
      // TODO: Consider whether we really need to refresh user auth context here
      // For now, let's skip the checkAuth() call to prevent session switching
      // await checkAuth(); 
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update profile' 
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpdate = (newPhotoUrl: string) => {
    setProfileData(prev => ({
      ...prev,
      profilePhotoUrl: newPhotoUrl
    }));
    setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                {user.userType === 'family_member' 
                  ? 'Your basic account information (click Edit Profile to modify)' 
                  : 'Your basic account information'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Profile Picture Upload - only for family members */}
                {user.userType === 'family_member' && (
                  <div className="flex justify-center mb-6">
                    <ProfilePictureUpload
                      currentPhotoUrl={profileData.profilePhotoUrl}
                      userName={`${user.first_name} ${user.last_name}`}
                      onPhotoUpdate={handlePhotoUpdate}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={isEditing ? profileData.firstName : user.first_name}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing || profileLoading}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={isEditing ? profileData.lastName : user.last_name}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing || profileLoading}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={user.username}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Your username cannot be changed
                  </p>
                </div>

                {user.email && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user.role === 'admin' ? 'Administrator' : 'Family Member'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userType">Account Type</Label>
                  <Input
                    id="userType"
                    value={user.userType === 'admin' ? 'Admin User' : 'Family Member'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {/* Additional profile fields for family members */}
                {user.userType === 'family_member' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="maidenName">Maiden Name</Label>
                      <Input
                        id="maidenName"
                        value={isEditing ? profileData.maidenName : profileData.maidenName}
                        onChange={(e) => handleInputChange('maidenName', e.target.value)}
                        disabled={!isEditing || profileLoading}
                        className={!isEditing ? "bg-gray-50" : ""}
                        placeholder="Enter maiden name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                          id="gender"
                          value={isEditing ? profileData.gender : profileData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          disabled={!isEditing || profileLoading}
                          className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${!isEditing ? "bg-gray-50" : ""}`}
                        >
                          <option value="">Select gender</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Birth Date</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={isEditing ? profileData.birthDate : profileData.birthDate}
                          onChange={(e) => handleInputChange('birthDate', e.target.value)}
                          disabled={!isEditing || profileLoading}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthPlace">Birth Place</Label>
                      <Input
                        id="birthPlace"
                        value={isEditing ? profileData.birthPlace : profileData.birthPlace}
                        onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                        disabled={!isEditing || profileLoading}
                        className={!isEditing ? "bg-gray-50" : ""}
                        placeholder="Enter birth place"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={isEditing ? profileData.phone : profileData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing || profileLoading}
                          className={!isEditing ? "bg-gray-50" : ""}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={isEditing ? profileData.occupation : profileData.occupation}
                          onChange={(e) => handleInputChange('occupation', e.target.value)}
                          disabled={!isEditing || profileLoading}
                          className={!isEditing ? "bg-gray-50" : ""}
                          placeholder="Enter occupation"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="biography">Biography</Label>
                      <textarea
                        id="biography"
                        value={isEditing ? profileData.biography : profileData.biography}
                        onChange={(e) => handleInputChange('biography', e.target.value)}
                        disabled={!isEditing || profileLoading}
                        className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${!isEditing ? "bg-gray-50" : ""}`}
                        placeholder="Enter biography"
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                {user.userType === 'family_member' ? (
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        onClick={handleProfileEdit}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleProfileSave}
                          disabled={profileLoading}
                          className="flex items-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {profileLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          onClick={handleProfileCancel}
                          variant="outline"
                          disabled={profileLoading}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    To update your personal information, please contact your family administrator.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Change Password</span>
              </CardTitle>
              <CardDescription>
                Update your account password for better security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordMessage && (
                  <Alert variant={passwordMessage.type === 'error' ? 'destructive' : 'default'}>
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{passwordMessage.text}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      required
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                      disabled={passwordLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                >
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>

              {user.mustChangePassword && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Password Change Required</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        You must change your password before you can access other features.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
            <CardDescription>
              Information about your account status and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Account Active</p>
                  <p className="text-sm text-gray-500">Your account is active and in good standing</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${user.mustChangePassword ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <div>
                  <p className="font-medium text-gray-900">Password Status</p>
                  <p className="text-sm text-gray-500">
                    {user.mustChangePassword ? 'Password change required' : 'Password up to date'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Session Active</p>
                  <p className="text-sm text-gray-500">Signed in successfully</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;