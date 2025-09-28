import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useThemePreferences } from '@/hooks/use-theme-preferences';
import { useAdvancedTheme } from '@/contexts/AdvancedThemeContext';
import { Settings, X, RefreshCw, Trash2 } from 'lucide-react';

interface ThemeDebugPanelProps {
  className?: string;
}

export const ThemeDebugPanel: React.FC<ThemeDebugPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    themeStatus, 
    syncPreferences, 
    resetToSystemDefault,
    isToggling 
  } = useThemePreferences();
  const { 
    currentTheme, 
    themes,
    clearThemePreferences,
    syncThemePreferences 
  } = useAdvancedTheme();
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await syncPreferences();
      console.log('Theme preferences synced manually');
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await resetToSystemDefault();
      console.log('Theme reset to system default');
    } catch (error) {
      console.error('Failed to reset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all theme preferences? This will reset everything to defaults.')) {
      setIsLoading(true);
      try {
        await clearThemePreferences();
        console.log('All theme preferences cleared');
      } catch (error) {
        console.error('Failed to clear preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 ${className}`}
        title="Open Theme Debug Panel"
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Theme Debug Panel</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Current Status */}
        <div className="space-y-2">
          <h4 className="font-medium">Current Status</h4>
          <div className="grid grid-cols-2 gap-2">
            <Badge variant={themeStatus.isDarkMode ? "default" : "secondary"}>
              {themeStatus.isDarkMode ? 'Dark' : 'Light'} Mode
            </Badge>
            <Badge variant={themeStatus.initialized ? "default" : "destructive"}>
              {themeStatus.initialized ? 'Initialized' : 'Loading'}
            </Badge>
            <Badge variant={themeStatus.isFollowingSystem ? "default" : "outline"}>
              {themeStatus.isFollowingSystem ? 'Following System' : 'Custom Setting'}
            </Badge>
            <Badge variant={themeStatus.isDefaultTheme ? "secondary" : "outline"}>
              {themeStatus.isDefaultTheme ? 'Default Theme' : 'Custom Theme'}
            </Badge>
          </div>
        </div>

        {/* Theme Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Theme Information</h4>
          <div className="space-y-1">
            <div><strong>Name:</strong> {themeStatus.currentThemeName}</div>
            <div><strong>ID:</strong> {currentTheme.id}</div>
            <div><strong>Type:</strong> {currentTheme.type}</div>
            <div><strong>System Prefers:</strong> {themeStatus.systemPrefersDark ? 'Dark' : 'Light'}</div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Storage</h4>
          <div className="space-y-1">
            <div><strong>localStorage isDarkMode:</strong> {localStorage.getItem('isDarkMode') || 'null'}</div>
            <div><strong>localStorage themeId:</strong> {localStorage.getItem('selectedThemeId') || 'null'}</div>
            <div><strong>Total Themes:</strong> {themes.length}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <h4 className="font-medium">Actions</h4>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isLoading || isToggling}
              className="justify-start"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync Preferences
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading || isToggling}
              className="justify-start"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Reset to System
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
              disabled={isLoading || isToggling}
              className="justify-start"
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Clear All Preferences
            </Button>
          </div>
        </div>

        {/* Runtime Info */}
        <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t">
          <div>Last Update: {new Date().toLocaleTimeString()}</div>
          <div>Debug Panel v1.0</div>
        </div>
      </CardContent>
    </Card>
  );
};