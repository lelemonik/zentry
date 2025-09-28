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
import { offlineDB } from '../lib/offline-db';
import { updateProfile } from 'firebase/auth';
import { usePersistedState } from '@/hooks/use-local-storage';
import { universalSync, autoSave, loadData } from '@/lib/universal-sync';

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
  
  // Additional user data (university info)
  const [userExtras, setUserExtras] = useState({
    university: ''
  });
  
  // User statistics
  const [userStats, setUserStats] = useState({
    tasksCompleted: 0,
    notesCreated: 0,
    eventsScheduled: 0,
    daysActive: 0,
    loading: true
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
      loadUserStats();
    }
  }, [currentUser]);

  // Listen for real-time updates from other devices
  useEffect(() => {
    if (!currentUser) return;

    const handleProfileUpdate = (event: CustomEvent) => {
      const { data } = event.detail;
      if (data) {
        console.log('📱 Received profile update from another device');
        setProfile(prevProfile => ({
          ...data,
          email: currentUser.email || data.email || prevProfile.email
        }));
      }
    };

    const handleUserDataUpdate = (event: CustomEvent) => {
      const { data } = event.detail;
      if (data) {
        console.log('📱 Received user data update from another device');
        setUserExtras(prev => ({
          ...prev,
          university: data.university || prev.university
        }));
      }
    };

    // Add event listeners
    window.addEventListener('userProfilesUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('userProfilesUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    };
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      // Ensure database is initialized
      await offlineDB.init();
      
      let savedProfile, savedUserData;
      
      try {
        // Load profile from IndexedDB
        savedProfile = await offlineDB.get('userProfiles', currentUser?.uid || '');
        // Load user basic data from IndexedDB
        savedUserData = await offlineDB.get('userData', currentUser?.uid || '');
      } catch (dbError: any) {
        // If object store error, clear and reinitialize database
        if (dbError.message && dbError.message.includes('object stores')) {
          console.log('Clearing database due to object store error during load...');
          await offlineDB.clearDatabase();
          await offlineDB.init();
          
          // Try loading again after reset (will be null for fresh database)
          savedProfile = await offlineDB.get('userProfiles', currentUser?.uid || '');
          savedUserData = await offlineDB.get('userData', currentUser?.uid || '');
        } else {
          throw dbError;
        }
      }
      
      // Load profile data using universal sync (handles both local and Firestore)
      const profileData = await loadData('userProfiles', currentUser.uid);
      if (profileData) {
        setProfile({
          ...profileData,
          email: currentUser?.email || profileData.email || ''
        });
      } else {
        // Use current user data as fallback
        const defaultProfile = {
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
        };
        setProfile(defaultProfile);
        
        // Save default profile for future use
        autoSave('userProfiles', currentUser.uid, defaultProfile, 100);
      }

      // Load user extras data using universal sync
      const userData = await loadData('userData', currentUser.uid);
      if (userData) {
        setUserExtras({
          university: userData.university || ''
        });
      } else {
        // Initialize with default values
        const defaultUserData = {
          displayName: currentUser?.displayName || '',
          email: currentUser?.email || '',
          university: ''
        };
        setUserExtras({
          university: ''
        });
        
        // Save default user data for future use
        autoSave('userData', currentUser.uid, defaultUserData, 100);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to load profile data. Please refresh the page.' 
      });
    }
  };

  const loadUserStats = async () => {
    try {
      // Ensure database is initialized
      await offlineDB.init();
      
      // Get all user data to calculate statistics
      const [tasks, notes, schedules] = await Promise.all([
        offlineDB.getAll('tasks'),
        offlineDB.getAll('notes'),
        offlineDB.getAll('schedules')
      ]);

      // Calculate tasks completed
      const completedTasks = tasks.filter((task: any) => task.completed).length;
      
      // Calculate notes created
      const notesCount = notes.length;
      
      // Calculate events scheduled
      const eventsCount = schedules.length;
      
      // Calculate days active (based on when user first created content)
      let daysActive = 0;
      const allItems = [...tasks, ...notes, ...schedules];
      if (allItems.length > 0) {
        const dates = allItems
          .map((item: any) => item.createdAt || item.lastModified || Date.now())
          .filter(Boolean)
          .map(timestamp => new Date(timestamp).toDateString());
        
        const uniqueDates = new Set(dates);
        daysActive = uniqueDates.size;
      } else if (currentUser?.metadata?.creationTime) {
        // If no content but user exists, calculate days since account creation
        const creationDate = new Date(currentUser.metadata.creationTime);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - creationDate.getTime());
        daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      setUserStats({
        tasksCompleted: completedTasks,
        notesCreated: notesCount,
        eventsScheduled: eventsCount,
        daysActive: daysActive,
        loading: false
      });

    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'User not authenticated. Please log in again.' });
      return;
    }

    // Validate profile data
    if (!validateProfile()) {
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Ensure database is initialized
      await offlineDB.init();
      
      // Prepare the complete profile data
      const updatedProfile = {
        ...profile,
        email: currentUser.email || profile.email
      };

      // Save profile data to IndexedDB with fallback
      try {
        await offlineDB.update('userProfiles', {
          id: currentUser.uid,
          data: updatedProfile,
          updatedAt: Date.now()
        });

        // Save user additional data (university) to IndexedDB
        const userData = {
          displayName: profile.displayName,
          email: currentUser.email,
          university: userExtras.university
        };
        
        await offlineDB.update('userData', {
          id: currentUser.uid,
          data: userData,
          updatedAt: Date.now()
        });
      } catch (dbError: any) {
        // If object store error, clear and reinitialize database
        if (dbError.message && dbError.message.includes('object stores')) {
          console.log('Clearing database due to object store error, reinitializing...');
          await offlineDB.clearDatabase();
          await offlineDB.init();
          
          // Retry saving after database reset
          await offlineDB.update('userProfiles', {
            id: currentUser.uid,
            data: updatedProfile,
            updatedAt: Date.now()
          });

          const userData = {
            displayName: profile.displayName,
            email: currentUser.email,
            university: userExtras.university
          };
          
          await offlineDB.update('userData', {
            id: currentUser.uid,
            data: userData,
            updatedAt: Date.now()
          });
        } else {
          throw dbError;
        }
      }

      // Update Firebase Auth profile if display name or photo changed
      if (profile.displayName !== currentUser.displayName || 
          updatedProfile.photoURL !== currentUser.photoURL) {
        await updateUserProfile({
          displayName: profile.displayName || currentUser.displayName,
          photoURL: updatedProfile.photoURL || currentUser.photoURL
        });
      }

      // Update local profile state
      setProfile(updatedProfile);
      
      // Refresh user stats after saving
      loadUserStats();
      
      setIsEditing(false);
      const savedFields = [
        profile.displayName && 'display name',
        profile.bio && 'bio',
        profile.location && 'location',
        profile.website && 'website',
        profile.phone && 'phone',
        userExtras.university && 'university'
      ].filter(Boolean);
      
      setMessage({ 
        type: 'success', 
        text: `Profile saved successfully! Updated: ${savedFields.join(', ') || 'basic information'}.` 
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setMessage({ 
        type: 'error', 
        text: error?.message || 'Failed to save profile. Please try again.' 
      });
      // Clear error message after 8 seconds
      setTimeout(() => setMessage(null), 8000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);
    
    // Clear any validation messages when user starts typing
    if (message && message.type === 'error' && field === 'displayName') {
      setMessage(null);
    }

    // Show auto-saving indicator
    setIsAutoSaving(true);

    // Auto-save with debouncing (wait 3 seconds after user stops typing)
    if (currentUser) {
      setTimeout(() => setIsAutoSaving(false), 3500); // Hide indicator slightly after save
      autoSave('userProfiles', currentUser.uid, updatedProfile, 3000);
    }
  };

  const handleUniversityChange = (value: string) => {
    const updatedExtras = { ...userExtras, university: value };
    setUserExtras(updatedExtras);
    
    // Show auto-saving indicator
    setIsAutoSaving(true);
    
    // Auto-save university data
    if (currentUser) {
      const userData = {
        displayName: profile.displayName,
        email: currentUser.email || profile.email,
        university: value
      };
      setTimeout(() => setIsAutoSaving(false), 3500); // Hide indicator slightly after save
      autoSave('userData', currentUser.uid, userData, 3000);
    }
  };

  const validateProfile = (): boolean => {
    if (!profile.displayName?.trim()) {
      setMessage({ type: 'error', text: 'Display name is required and cannot be empty.' });
      return false;
    }
    
    if (profile.displayName.length > 50) {
      setMessage({ type: 'error', text: 'Display name must be less than 50 characters.' });
      return false;
    }


    
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return false;
    }
    
    if (profile.website && profile.website.trim()) {
      try {
        new URL(profile.website);
      } catch {
        setMessage({ type: 'error', text: 'Please enter a valid website URL (include http:// or https://).' });
        return false;
      }
    }
    
    return true;
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setMessage({ 
        type: 'error', 
        text: 'Please select a valid image file (JPEG, PNG, WebP, or GIF).' 
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setMessage({ 
        type: 'error', 
        text: `Image size must be less than ${maxSizeInMB}MB. Please choose a smaller image.` 
      });
      return;
    }

    // Clear any existing error messages
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      // Create an image to validate dimensions and compress if needed
      const img = new Image();
      img.onload = () => {
        // Create canvas for resizing if image is too large
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set maximum dimensions
        const maxWidth = 400;
        const maxHeight = 400;
        
        let { width, height } = img;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress the image
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        handleInputChange('photoURL', compressedDataUrl);
        
        // Show success message
        setMessage({
          type: 'success',
          text: `Profile photo updated! Image resized to ${Math.round(width)}x${Math.round(height)}px.`
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      };
      
      img.onerror = () => {
        setMessage({ 
          type: 'error', 
          text: 'Failed to process the image. Please try another file.' 
        });
      };
      
      img.src = result;
    };
    
    reader.onerror = () => {
      setMessage({ 
        type: 'error', 
        text: 'Failed to read the image file. Please try again.' 
      });
    };
    
    reader.readAsDataURL(file);
  };

  const calculateProfileCompleteness = (): { percentage: number; missing: string[] } => {
    const fields = [
      { key: 'displayName', label: 'Display Name', value: profile.displayName },
      { key: 'bio', label: 'Bio', value: profile.bio },
      { key: 'location', label: 'Location', value: profile.location },
      { key: 'university', label: 'University', value: userExtras.university },
      { key: 'photoURL', label: 'Profile Photo', value: profile.photoURL },
    ];

    const completedFields = fields.filter(field => field.value && field.value.trim());
    const percentage = Math.round((completedFields.length / fields.length) * 100);
    const missing = fields.filter(field => !field.value || !field.value.trim()).map(field => field.label);

    return { percentage, missing };
  };



  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                Profile Information
                {isAutoSaving && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    Auto-saving...
                  </span>
                )}
              </CardTitle>
              {(() => {
                const { percentage, missing } = calculateProfileCompleteness();
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            percentage >= 80 ? 'bg-green-500' : 
                            percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">{percentage}% complete</span>
                    </div>
                    {percentage < 100 && (
                      <div className="text-xs text-muted-foreground">
                        Missing: {missing.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setMessage(null);
                      loadProfile(); // Reset changes
                    }}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4 sm:gap-6">
            <div className="flex flex-col items-center space-y-4 w-full sm:w-auto">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                <AvatarFallback className="text-lg sm:text-2xl">
                  {profile.displayName?.charAt(0) || profile.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="w-full sm:w-auto">
                  <Label htmlFor="photo-upload" className="cursor-pointer w-full">
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
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

            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profile.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your display name"
                    className="mt-1 h-10"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    value={currentUser?.email || 'No email available'}
                    readOnly
                    className="bg-muted cursor-not-allowed h-10 mt-1"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-semibold">Additional Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your location"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://yourwebsite.com"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Your phone number"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university" className="text-sm font-medium">University/School</Label>
                <Input
                  id="university"
                  value={userExtras.university}
                  onChange={(e) => handleUniversityChange(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your institution"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="text-sm font-medium">Member Since</Label>
                <Input
                  id="joinDate"
                  value={profile.joinDate || (currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : new Date().toLocaleDateString())}
                  readOnly
                  className="bg-muted cursor-not-allowed h-10"
                  placeholder="Member since date"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-lg font-semibold">Account Overview</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadUserStats}
                disabled={userStats.loading}
                className="text-xs"
              >
                {userStats.loading ? (
                  <div className="animate-spin h-3 w-3 border border-gray-400 border-t-transparent rounded-full"></div>
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-primary group-hover:scale-105 transition-transform">
                    {userStats.loading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 mx-auto rounded"></div>
                    ) : (
                      userStats.tasksCompleted.toLocaleString()
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Tasks Completed</div>
                  {!userStats.loading && userStats.tasksCompleted > 0 && (
                    <div className="text-xs text-green-600 mt-1">🎉 Great progress!</div>
                  )}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-secondary group-hover:scale-105 transition-transform">
                    {userStats.loading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 mx-auto rounded"></div>
                    ) : (
                      userStats.notesCreated.toLocaleString()
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Notes Created</div>
                  {!userStats.loading && userStats.notesCreated > 10 && (
                    <div className="text-xs text-blue-600 mt-1">📝 Productive writer!</div>
                  )}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-accent group-hover:scale-105 transition-transform">
                    {userStats.loading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 mx-auto rounded"></div>
                    ) : (
                      userStats.eventsScheduled.toLocaleString()
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Events Scheduled</div>
                  {!userStats.loading && userStats.eventsScheduled > 5 && (
                    <div className="text-xs text-purple-600 mt-1">📅 Well organized!</div>
                  )}
                </div>
              </Card>
              <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer group">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-success group-hover:scale-105 transition-transform">
                    {userStats.loading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-8 mx-auto rounded"></div>
                    ) : (
                      userStats.daysActive.toLocaleString()
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Days Active</div>
                  {!userStats.loading && userStats.daysActive > 30 && (
                    <div className="text-xs text-green-600 mt-1">🔥 Consistent user!</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>





      {/* Activity Timeline */}
      <Card className="shadow-medium">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="space-y-3">
            {/* Account Created Activity */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Created</span>
                  <span className="text-xs text-muted-foreground">
                    {currentUser?.metadata?.creationTime 
                      ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                      : 'Recently'
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Welcome to Zentry! Your productivity journey began.
                </p>
              </div>
            </div>

            {/* Profile Updates Activity */}
            {profile.displayName && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profile Updated</span>
                    <span className="text-xs text-muted-foreground">Today</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated display name to "{profile.displayName}"
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic activity based on user stats */}
            {userStats.tasksCompleted > 0 && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tasks Milestone</span>
                    <span className="text-xs text-muted-foreground">Recent</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed {userStats.tasksCompleted} task{userStats.tasksCompleted !== 1 ? 's' : ''}! 
                    {userStats.tasksCompleted >= 10 ? ' 🎉 You\'re on a roll!' : ''}
                  </p>
                </div>
              </div>
            )}

            {userStats.notesCreated > 0 && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Notes Created</span>
                    <span className="text-xs text-muted-foreground">Recent</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {userStats.notesCreated} note{userStats.notesCreated !== 1 ? 's' : ''}
                    {userStats.notesCreated >= 5 ? ' 📝 Great documentation!' : ''}
                  </p>
                </div>
              </div>
            )}

            {userStats.eventsScheduled > 0 && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Events Scheduled</span>
                    <span className="text-xs text-muted-foreground">Recent</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Scheduled {userStats.eventsScheduled} event{userStats.eventsScheduled !== 1 ? 's' : ''}
                    {userStats.eventsScheduled >= 3 ? ' 📅 Well organized!' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Login streak info */}
            {userStats.daysActive > 1 && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Activity Streak</span>
                    <span className="text-xs text-muted-foreground">Ongoing</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active for {userStats.daysActive} day{userStats.daysActive !== 1 ? 's' : ''}
                    {userStats.daysActive >= 7 ? ' 🔥 Great consistency!' : 
                     userStats.daysActive >= 30 ? ' 🏆 Amazing dedication!' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Show helpful message if no activity */}
            {userStats.tasksCompleted === 0 && userStats.notesCreated === 0 && userStats.eventsScheduled === 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">
                  <p className="mb-2">🚀 Ready to get started?</p>
                  <p className="text-xs">
                    Create your first task, note, or event to see your activity here!
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;