import React, { useState, useEffect, useCallback } from 'react';
import { User, Palette, Bell, Download, Trash2, Settings, Smartphone, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePersistedState } from '@/hooks/use-local-storage';
import { requestNotificationPermission, isAppInstalled } from '@/lib/pwa';
import { useAuth } from '@/contexts/AuthContext';
import { useAdvancedTheme } from '@/contexts/AdvancedThemeContext';
import AdvancedThemeCustomizer from './AdvancedThemeCustomizer';
import { cn } from '@/lib/utils';
import { responsiveClasses, getResponsiveFontSize } from '@/lib/responsive-utils';
import { offlineDB } from '@/lib/offline-db';

const THEME_COLORS = [
  { 
    name: 'Ocean', 
    primary: { light: '210 60% 55%', dark: '210 60% 65%' },
    secondary: { light: '260 40% 60%', dark: '260 40% 70%' },
    accent: { light: '160 50% 55%', dark: '160 50% 65%' }
  },
  { 
    name: 'Sunset', 
    primary: { light: '25 90% 60%', dark: '25 90% 70%' },
    secondary: { light: '10 80% 50%', dark: '10 80% 60%' },
    accent: { light: '45 90% 55%', dark: '45 90% 65%' }
  },
  { 
    name: 'Forest', 
    primary: { light: '140 60% 45%', dark: '140 60% 60%' },
    secondary: { light: '120 50% 40%', dark: '120 50% 55%' },
    accent: { light: '80 60% 50%', dark: '80 60% 65%' }
  },
  { 
    name: 'Lavender', 
    primary: { light: '260 60% 65%', dark: '260 60% 75%' },
    secondary: { light: '280 50% 60%', dark: '280 50% 70%' },
    accent: { light: '240 60% 70%', dark: '240 60% 80%' }
  },
  { 
    name: 'Rose', 
    primary: { light: '340 70% 60%', dark: '340 70% 70%' },
    secondary: { light: '320 60% 55%', dark: '320 60% 65%' },
    accent: { light: '10 70% 65%', dark: '10 70% 75%' }
  },
];

export default function UserSettings() {
  const { currentUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useAdvancedTheme();
  
  const [preferences, setPreferences] = usePersistedState('preferences', {
    notifications: true,
    compactView: false,
    showCompletedTasks: true,
    autoSave: true,
    soundEffects: true,
    emailNotifications: false,
    weekStartsMonday: true,
    timeFormat24h: false,
    language: 'en',
    fontSize: 'medium',
    animationsEnabled: true,
  });

  const [selectedTheme, setSelectedTheme] = usePersistedState('selectedTheme', THEME_COLORS[0]);
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

  const applyTheme = useCallback((themeColors: typeof THEME_COLORS[0]) => {
    const root = document.documentElement;
    const isDark = isDarkMode;
    
    // Apply theme colors based on current light/dark mode
    root.style.setProperty('--primary', isDark ? themeColors.primary.dark : themeColors.primary.light);
    root.style.setProperty('--secondary', isDark ? themeColors.secondary.dark : themeColors.secondary.light);
    root.style.setProperty('--accent', isDark ? themeColors.accent.dark : themeColors.accent.light);
    
    setSelectedTheme(themeColors);
  }, [isDarkMode]);

  // Re-apply theme colors when light/dark mode changes
  useEffect(() => {
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [selectedTheme, applyTheme]);

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
      // Save preferences to offline DB
      await offlineDB.saveUserPreferences(preferences);
      
      // Apply sound effects if enabled
      if (preferences.soundEffects) {
        // Play a subtle save sound (you can implement this)
        console.log('🔊 Settings saved sound');
      }
      
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
          await offlineDB.saveUserPreferences(preferences);
          if (preferences.soundEffects) {
            console.log('🔊 Auto-saved preferences');
          }
        } catch (error) {
          console.error('Error auto-saving preferences:', error);
        }
      }
    };

    // Debounce auto-save
    const timeoutId = setTimeout(savePreferences, 1000);
    return () => clearTimeout(timeoutId);
  }, [preferences]);

  const exportData = () => {
    // Export settings and preferences data
    const data = {
      preferences,
      theme: selectedTheme,
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
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-secondary" />
            Theme Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {THEME_COLORS.map((themeColor) => (
              <Card
                key={themeColor.name}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-medium",
                  selectedTheme.name === themeColor.name && "ring-2 ring-primary"
                )}
                onClick={() => applyTheme(themeColor)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${isDarkMode ? themeColor.primary.dark : themeColor.primary.light})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${isDarkMode ? themeColor.secondary.dark : themeColor.secondary.light})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${isDarkMode ? themeColor.accent.dark : themeColor.accent.light})` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{themeColor.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive reminders for tasks and classes
              </p>
            </div>
            <Switch
              checked={preferences.notifications && notificationPermission === 'granted'}
              onCheckedChange={handleNotificationToggle}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle between light and dark appearance
              </p>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Compact View</Label>
              <p className="text-sm text-muted-foreground">
                Show more items in less space
              </p>
            </div>
            <Switch
              checked={preferences.compactView}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, compactView: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Completed Tasks</Label>
              <p className="text-sm text-muted-foreground">
                Display completed tasks in task list
              </p>
            </div>
            <Switch
              checked={preferences.showCompletedTasks}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, showCompletedTasks: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-save</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save changes as you type
              </p>
            </div>
            <Switch
              checked={preferences.autoSave}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, autoSave: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for task completion and alerts
              </p>
            </div>
            <Switch
              checked={preferences.soundEffects}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, soundEffects: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email reminders for upcoming tasks
              </p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, emailNotifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Week Starts Monday</Label>
              <p className="text-sm text-muted-foreground">
                Calendar weeks start on Monday instead of Sunday
              </p>
            </div>
            <Switch
              checked={preferences.weekStartsMonday}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, weekStartsMonday: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>24-hour Time Format</Label>
              <p className="text-sm text-muted-foreground">
                Display time in 24-hour format (14:30) instead of 12-hour (2:30 PM)
              </p>
            </div>
            <Switch
              checked={preferences.timeFormat24h}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, timeFormat24h: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Animations</Label>
              <p className="text-sm text-muted-foreground">
                Enable smooth transitions and animations
              </p>
            </div>
            <Switch
              checked={preferences.animationsEnabled}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, animationsEnabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              value={preferences.language}
              onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
              <option value="it">Italiano</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <select
              id="fontSize"
              value={preferences.fontSize}
              onChange={(e) => setPreferences(prev => ({ ...prev, fontSize: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-accent" />
            App Installation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Install as App</Label>
              <p className="text-sm text-muted-foreground">
                {isInstalled ? 'App is installed on your device' : 'Install Zentry on your device for a native app experience'}
              </p>
            </div>
            {!isInstalled && deferredPrompt && (
              <Button 
                variant="default"
                onClick={installApp}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}
            {!isInstalled && !deferredPrompt && (
              <Badge variant="secondary">Not Available</Badge>
            )}
            {isInstalled && (
              <Badge variant="secondary">Installed</Badge>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Benefits of installing:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Works offline for viewing saved data</li>
              <li>Faster loading times</li>
              <li>Native app-like experience</li>
              <li>Push notifications for reminders</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Export Your Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your tasks, notes, and settings
              </p>
            </div>
            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>App Version</Label>
                <p className="text-sm text-muted-foreground">
                  Productivity PWA v1.0
                </p>
              </div>
              <Badge variant="outline">Latest</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save All Settings */}
      {!preferences.autoSave && (
        <Card className="shadow-medium border-primary/20">
          <CardContent className={cn(responsiveClasses.padding.card, "text-center")}>
            <div className="space-y-4">
              <div>
                <h3 className={cn("font-semibold text-primary", getResponsiveFontSize(preferences.fontSize))}>
                  Save All Settings
                </h3>
                <p className={cn("text-muted-foreground", responsiveClasses.text.small)}>
                  Save all your preferences and theme settings
                </p>
              </div>
              
              <Button 
                onClick={saveAllSettings} 
                disabled={loading}
                size="lg"
                className={cn(responsiveClasses.button.responsive, "bg-gradient-primary text-white font-medium shadow-medium hover:shadow-large")}
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving All Settings...' : 'Save All Settings'}
              </Button>
              
              {preferences.autoSave && (
                <Badge variant="secondary" className="mt-2">
                  Auto-save enabled - changes saved automatically
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}