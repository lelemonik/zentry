import React, { useState } from 'react';
import { User, Palette, Bell, Download, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const THEME_COLORS = [
  { name: 'Ocean', primary: '210 60% 55%', secondary: '260 40% 60%', accent: '160 50% 55%' },
  { name: 'Sunset', primary: '25 90% 60%', secondary: '10 80% 50%', accent: '45 90% 55%' },
  { name: 'Forest', primary: '140 60% 45%', secondary: '120 50% 40%', accent: '80 60% 50%' },
  { name: 'Lavender', primary: '260 60% 65%', secondary: '280 50% 60%', accent: '240 60% 70%' },
  { name: 'Rose', primary: '340 70% 60%', secondary: '320 60% 55%', accent: '10 70% 65%' },
];

export default function UserSettings() {
  const [user, setUser] = useState({
    name: 'Student',
    email: '',
    university: '',
  });
  
  const [preferences, setPreferences] = useState({
    notifications: true,
    darkMode: false,
    compactView: false,
    showCompletedTasks: true,
  });

  const [selectedTheme, setSelectedTheme] = useState(THEME_COLORS[0]);

  const applyTheme = (theme: typeof THEME_COLORS[0]) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    setSelectedTheme(theme);
  };

  const exportData = () => {
    // In a real app, this would export user data
    const data = {
      user,
      preferences,
      theme: selectedTheme,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-app-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={user.name}
                onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
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
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="university">University/School</Label>
              <Input
                id="university"
                value={user.university}
                onChange={(e) => setUser(prev => ({ ...prev, university: e.target.value }))}
                placeholder="Enter your institution"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-secondary" />
            Theme Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {THEME_COLORS.map((theme) => (
              <Card
                key={theme.name}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-medium",
                  selectedTheme.name === theme.name && "ring-2 ring-primary"
                )}
                onClick={() => applyTheme(theme)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${theme.primary})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${theme.secondary})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `hsl(${theme.accent})` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{theme.name}</span>
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
              checked={preferences.notifications}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, notifications: checked }))
              }
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
              checked={preferences.darkMode}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({ ...prev, darkMode: checked }))
              }
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
                  Student Productivity PWA v1.0
                </p>
              </div>
              <Badge variant="outline">Latest</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}