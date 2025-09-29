import React, { useState, useEffect, useCallback } from 'react';
import { User, Bell, Download, Trash2, Settings, Smartphone, Save, Check, X, AlertCircle, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersistedState } from '@/hooks/use-local-storage';
import { requestNotificationPermission, isAppInstalled } from '@/lib/pwa';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { responsiveClasses, getResponsiveFontSize } from '@/lib/responsive-utils';
import { offlineDB } from '../lib/offline-db';
import LanguageFontDemo from './LanguageFontDemo';

export default function UserSettings() {
  const { currentUser } = useAuth();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const { fontSize, setFontSize, fontSizeClasses, availableSizes } = useFontSize();
  const { preferences, setPreferences, updatePreference } = usePreferences();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check notification permission status
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Check if app is installed as PWA
    setIsInstalled(isAppInstalled());

    // Set up PWA install prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked && notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationPermission('granted');
        setPreferences(prev => ({ ...prev, notifications: true }));
      }
    } else {
      setPreferences(prev => ({ ...prev, notifications: checked }));
    }
  };



  const installApp = async () => {
    if (!deferredPrompt) return;
    
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setMessage({ type: 'success', text: 'App installed successfully!' });
      }
      
      setDeferredPrompt(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Install failed:', error);
      setMessage({ type: 'error', text: 'Installation failed. Please try again.' });
    }
  };

  const saveAllSettings = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Save all preferences including language and font size
      const allPreferences = {
        ...preferences,
        language,
        fontSize
      };
      await offlineDB.saveUserPreferences(allPreferences);
      
      setMessage({ type: 'success', text: 'All settings saved successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-save preferences when autoSave is enabled
  React.useEffect(() => {
    const savePreferences = async () => {
      if (preferences.autoSave) {
        try {
          // Include current language and font size in saved preferences
          const allPreferences = {
            ...preferences,
            language,
            fontSize
          };
          await offlineDB.saveUserPreferences(allPreferences);
        } catch (error) {
          console.error('Error auto-saving preferences:', error);
        }
      }
    };

    // Debounce auto-save
    const timeoutId = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timeoutId);
  }, [preferences, language, fontSize]);

  const exportData = () => {
    // Export settings and preferences data
    const data = {
      preferences,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zentry-app-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 max-w-4xl mx-auto">
      {/* Language & Font Size Demo */}
      <LanguageFontDemo />
      
      {/* Success/Error Messages */}
      {message && (
        <Alert 
          variant={message.type === 'success' ? 'default' : 'destructive'} 
          className={`mb-4 transition-all duration-300 ${
            message.type === 'success' 
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300' 
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          <AlertDescription className="text-sm font-medium flex items-center gap-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3 sm:pb-6 px-4 sm:px-6">
          <CardTitle className={cn("flex items-center gap-2 font-semibold", fontSizeClasses.heading)}>
            <Bell className="h-5 w-5 text-primary" />
            {t('preferences')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          {/* Notifications Section */}
          <div className="space-y-4">
            <h3 className={cn("font-semibold text-muted-foreground uppercase tracking-wide", fontSizeClasses.small)}>
              {t('notifications')}
            </h3>
            
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label className="text-sm sm:text-base font-medium">Push Notifications</Label>
                  {notificationPermission === 'denied' && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5">Blocked</Badge>
                  )}
                  {notificationPermission === 'granted' && preferences.notifications && (
                    <Badge variant="default" className="text-xs px-1.5 py-0.5">Active</Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Receive real-time reminders for tasks, classes, and deadlines
                </p>
              </div>
              <Switch
                checked={preferences.notifications && notificationPermission === 'granted'}
                onCheckedChange={handleNotificationToggle}
                className="shrink-0"
              />
            </div>


          </div>

          {/* Interface & Display */}
          <div className="space-y-4">
            <h3 className={cn("font-semibold text-muted-foreground uppercase tracking-wide", fontSizeClasses.small)}>
              Interface & Display
            </h3>
            


            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label className={cn("font-medium", fontSizeClasses.text)}>Show Completed Tasks</Label>
                  {preferences.showCompletedTasks ? (
                    <Badge variant="default" className="text-xs px-1.5 py-0.5">Visible</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Hidden</Badge>
                  )}
                </div>
                <p className={cn("text-muted-foreground leading-relaxed", fontSizeClasses.small)}>
                  {preferences.showCompletedTasks 
                    ? "Completed tasks are shown in all task lists" 
                    : "Completed tasks are hidden from 'All' and 'Active' views"}
                </p>
              </div>
              <Switch
                checked={preferences.showCompletedTasks}
                onCheckedChange={(checked) => updatePreference('showCompletedTasks', checked)}
                className="shrink-0"
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label className={cn("font-medium", fontSizeClasses.text)}>Animations</Label>
                  {preferences.animationsEnabled ? (
                    <Badge variant="default" className="text-xs px-1.5 py-0.5">
                      ✨ Enabled
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      🚫 Disabled
                    </Badge>
                  )}
                </div>
                <p className={cn("text-muted-foreground leading-relaxed", fontSizeClasses.small)}>
                  {preferences.animationsEnabled 
                    ? "Smooth transitions and visual effects are active"
                    : "All animations and transitions are disabled for better performance"}
                </p>
              </div>
              <Switch
                checked={preferences.animationsEnabled}
                onCheckedChange={(checked) => updatePreference('animationsEnabled', checked)}
                className="shrink-0"
              />
            </div>
          </div>

          {/* Data & Behavior */}
          <div className="space-y-4">
            <h3 className={cn("font-semibold text-muted-foreground uppercase tracking-wide", fontSizeClasses.small)}>
              Data & Behavior
            </h3>
            
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label className="text-sm sm:text-base font-medium">Auto-save</Label>
                  {preferences.autoSave && (
                    <Badge variant="default" className="text-xs px-1.5 py-0.5">Active</Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Automatically save changes as you type
                </p>
              </div>
              <Switch
                checked={preferences.autoSave}
                onCheckedChange={(checked) => updatePreference('autoSave', checked)}
                className="shrink-0"
              />
            </div>


          </div>



          {/* Accessibility & Localization */}
          <div className="space-y-4">
            <h3 className={cn("font-semibold text-muted-foreground uppercase tracking-wide", fontSizeClasses.small)}>
              Accessibility & Localization
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language" className={cn("font-medium", fontSizeClasses.small)}>
                  {t('language')}
                </Label>
                <Select
                  value={language}
                  onValueChange={setLanguage}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder={t('language')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={cn("text-muted-foreground", fontSizeClasses.small)}>
                  Interface language will change immediately
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontSize" className={cn("font-medium", fontSizeClasses.small)}>
                  {t('fontSize')}
                </Label>
                <Select
                  value={fontSize}
                  onValueChange={setFontSize}
                >
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder={t('fontSize')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label} ({size.px})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={cn("text-muted-foreground", fontSizeClasses.small)}>
                  Font size changes apply immediately
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
            <Smartphone className="h-5 w-5 text-primary" />
            App Installation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm sm:text-base font-medium">Progressive Web App</Label>
                {isInstalled ? (
                  <Badge variant="default" className="text-xs px-2 py-1">
                    <Check className="h-3 w-3 mr-1" />
                    Installed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    <Download className="h-3 w-3 mr-1" />
                    Available
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isInstalled 
                  ? 'Zentry is installed on your device for the best experience'
                  : 'Install Zentry as a native app for enhanced performance and offline access'
                }
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {!isInstalled && deferredPrompt && (
                <Button 
                  onClick={installApp}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
              
              {!isInstalled && !deferredPrompt && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Monitor className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Installation prompt not available.<br />
                    Use your browser's "Add to Home Screen" option.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {!isInstalled && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                Installation Benefits
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                  Works completely offline with cached data
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  Faster loading times and smoother performance
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                  Native app-like experience with full-screen mode
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"></div>
                  Push notifications for task reminders
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></div>
                  Access from your device's home screen
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
            <Settings className="h-5 w-5 text-primary" />
            Data & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-sm sm:text-base font-medium">Export Your Data</Label>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Download all your tasks, notes, schedules, and settings as JSON
              </p>
            </div>
            <Button 
              onClick={exportData} 
              variant="outline"
              className="w-full sm:w-auto hover:bg-primary hover:text-primary-foreground transition-colors"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <div className="pt-4 border-t border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Label className="text-sm sm:text-base font-medium">App Information</Label>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Zentry Productivity PWA v1.2.0
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Built with React, TypeScript, and Firebase
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="default" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Latest
                </Badge>
                <Badge variant="secondary" className="text-xs">PWA</Badge>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Privacy Note
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your data is stored locally on your device and synchronized with Firebase. 
              You have full control over your data and can export or delete it at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save All Settings - Only show if auto-save is disabled */}
      {!preferences.autoSave && (
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardContent className="text-center p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Save className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-primary">
                  Manual Save Required
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Auto-save is disabled. Click the button below to save all your preferences and settings.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={saveAllSettings} 
                  disabled={loading}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving Settings...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save All Settings
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Or enable auto-save above to save changes automatically
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-save Status */}
      {preferences.autoSave && (
        <Card className="shadow-md border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
          <CardContent className="text-center p-4">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium">Auto-save enabled - all changes are saved automatically</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}