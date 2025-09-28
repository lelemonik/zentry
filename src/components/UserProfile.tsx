import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Camera, Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { offlineDB } from '@/lib/offline-db';
import { updateProfile } from 'firebase/auth';
import { usePersistedState } from '@/hooks/use-local-storage';

interface UserProfile {
  displayName: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  joinDate: string;
  photoURL: string;
}

const UserProfile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    joinDate: '',
    photoURL: ''
  });
  
  // User basic profile settings (moved from UserSettings)
  const [user, setUser] = usePersistedState('user', {
    name: '',
    email: '',
    university: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
      // Load user data from Firebase when currentUser changes
      setUser({
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        university: user.university, // Keep existing university data
      });
    }
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      // Load profile from IndexedDB or use current user data
      const savedProfile = await offlineDB.get('userProfiles', currentUser?.uid || '');
      
      if (savedProfile) {
        setProfile(savedProfile.data);
      } else {
        // Use current user data as fallback
        setProfile({
          displayName: currentUser?.displayName || '',
          email: currentUser?.email || '',
          bio: '',
          location: '',
          website: '',
          phone: '',
          joinDate: currentUser?.metadata?.creationTime 
            ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
            : new Date().toLocaleDateString(),
          photoURL: currentUser?.photoURL || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to IndexedDB
      await offlineDB.add('userProfiles', {
        id: currentUser?.uid || '',
        data: profile,
        updatedAt: Date.now()
      });

      // Update Firebase Auth profile if display name or photo changed
      if (currentUser && (
        profile.displayName !== currentUser.displayName || 
        profile.photoURL !== currentUser.photoURL
      )) {
        await updateUserProfile({
          displayName: profile.displayName,
          photoURL: profile.photoURL
        });
      }

      setIsEditing(false);
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleInputChange('photoURL', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save basic profile information (moved from UserSettings)
  const saveProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Update Firebase auth profile
      await updateProfile(currentUser, {
        displayName: user.name,
      });
      
      // Save to local storage (university is not stored in Firebase Auth)
      setUser(prev => ({ ...prev }));
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      loadProfile(); // Reset changes
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                <AvatarFallback className="text-2xl">
                  {profile.displayName?.charAt(0) || profile.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div>
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Additional Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your location"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <Label htmlFor="joinDate">Member Since</Label>
                <Input
                  id="joinDate"
                  value={profile.joinDate}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Stats */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Account Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">0</div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">0</div>
                  <div className="text-sm text-muted-foreground">Notes Created</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">0</div>
                  <div className="text-sm text-muted-foreground">Events Scheduled</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">0</div>
                  <div className="text-sm text-muted-foreground">Days Active</div>
                </div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Profile Settings - Moved from UserSettings */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Basic Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={user.name}
                onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                onChange={(e) => setUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
                disabled={true}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here. Use your authentication provider settings.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="university">University/School</Label>
              <Input
                id="university"
                value={user.university}
                onChange={(e) => setUser(prev => ({ ...prev, university: e.target.value }))}
                placeholder="Enter your institution"
                disabled={isSaving}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={saveProfile} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;