import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Wand2, 
  Download, 
  Upload, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Search,
  Heart,
  Copy,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdvancedTheme, CustomTheme } from '@/contexts/AdvancedThemeContext';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const [showPicker, setShowPicker] = useState(false);
  
  // Convert HSL to hex for color input
  const hslToHex = (hsl: string): string => {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return '#000000';
    
    const [, h, s, l] = match.map(Number);
    const hDecimal = h / 360;
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    
    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs((hDecimal * 6) % 2 - 1));
    const m = lDecimal - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= hDecimal && hDecimal < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= hDecimal && hDecimal < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= hDecimal && hDecimal < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= hDecimal && hDecimal < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= hDecimal && hDecimal < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= hDecimal && hDecimal < 1) {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return value;
    
    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="hsl(210, 60%, 55%)"
          className="flex-1"
        />
      </div>
      {showPicker && (
        <div className="p-2 border rounded-lg bg-surface">
          <input
            type="color"
            value={hslToHex(value)}
            onChange={(e) => onChange(hexToHsl(e.target.value))}
            className="w-full h-20 rounded cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export default function AdvancedThemeCustomizer() {
  const { 
    currentTheme, 
    themes, 
    isDarkMode,
    setTheme, 
    createCustomTheme, 
    updateTheme,
    deleteTheme,
    exportTheme,
    importTheme,
    applyWallpaper
  } = useAdvancedTheme();
  
  const { } = useAuth();
  
  const [editingTheme, setEditingTheme] = useState<CustomTheme>(currentTheme);
  const [isPreview, setIsPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTab, setSelectedTab] = useState('colors');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setEditingTheme(currentTheme);
  }, [currentTheme]);



  const applyPreview = () => {
    if (isPreview) {
      setTheme(editingTheme);
    } else {
      setTheme(currentTheme);
    }
  };

  const saveTheme = async () => {
    try {
      if (editingTheme.type === 'custom') {
        await updateTheme(editingTheme.id, editingTheme);
      } else {
        // Create new custom theme
        const newTheme = await createCustomTheme({
          ...editingTheme,
          name: `${editingTheme.name} (Custom)`,
        });
        setEditingTheme(newTheme);
      }
      setMessage({ type: 'success', text: 'Theme saved successfully!' });
    } catch (error) {
      console.error('Error saving theme:', error);
      setMessage({ type: 'error', text: 'Failed to save theme' });
    }
  };

  const exportCurrentTheme = () => {
    const themeData = exportTheme(editingTheme.id);
    if (themeData) {
      const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${themeData.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importThemeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const themeData = JSON.parse(e.target?.result as string);
          await importTheme(themeData);
          setMessage({ type: 'success', text: 'Theme imported successfully!' });
        } catch (error) {
          console.error('Error importing theme:', error);
          setMessage({ type: 'error', text: 'Failed to import theme' });
        }
      };
      reader.readAsText(file);
    }
  };

  const resetToOriginal = () => {
    setEditingTheme(currentTheme);
    setIsPreview(false);
  };

  const generateRandomTheme = () => {
    const hues = [Math.floor(Math.random() * 360), Math.floor(Math.random() * 360), Math.floor(Math.random() * 360)];
    const randomTheme: CustomTheme = {
      ...editingTheme,
      name: `Random Theme ${Date.now()}`,
      colors: {
        primary: `hsl(${hues[0]}, ${60 + Math.random() * 30}%, ${45 + Math.random() * 20}%)`,
        secondary: `hsl(${hues[1]}, ${50 + Math.random() * 30}%, ${50 + Math.random() * 20}%)`,
        accent: `hsl(${hues[2]}, ${55 + Math.random() * 30}%, ${50 + Math.random() * 20}%)`,
        background: isDarkMode ? 'hsl(0, 0%, 9%)' : 'hsl(0, 0%, 100%)',
        surface: isDarkMode ? 'hsl(0, 0%, 13%)' : 'hsl(0, 0%, 98%)',
        text: isDarkMode ? 'hsl(0, 0%, 98%)' : 'hsl(0, 0%, 9%)',
        textMuted: isDarkMode ? 'hsl(0, 0%, 65%)' : 'hsl(0, 0%, 45%)',
        border: isDarkMode ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 89%)',
      },
      wallpaper: {
        type: 'gradient',
        value: `linear-gradient(135deg, hsl(${hues[0]}, 60%, ${isDarkMode ? 15 : 90}%) 0%, hsl(${hues[1]}, 50%, ${isDarkMode ? 20 : 85}%) 50%, hsl(${hues[2]}, 55%, ${isDarkMode ? 15 : 90}%) 100%)`,
        opacity: 0.3 + Math.random() * 0.4
      }
    };
    setEditingTheme(randomTheme);
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Advanced Theme Customizer
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsPreview(!isPreview);
                  applyPreview();
                }}
              >
                {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isPreview ? 'Stop Preview' : 'Preview'}
              </Button>
              <Button size="sm" onClick={saveTheme}>
                <Save className="h-4 w-4 mr-2" />
                Save Theme
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-4" variant={message.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="wallpaper">Wallpaper</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Color Scheme</h3>
                <Button size="sm" variant="outline" onClick={generateRandomTheme}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Random Colors
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorPicker
                  label="Primary Color"
                  value={editingTheme.colors.primary}
                  onChange={(value) => setEditingTheme(prev => ({
                    ...prev,
                    colors: { ...prev.colors, primary: value }
                  }))}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={editingTheme.colors.secondary}
                  onChange={(value) => setEditingTheme(prev => ({
                    ...prev,
                    colors: { ...prev.colors, secondary: value }
                  }))}
                />
                <ColorPicker
                  label="Accent Color"
                  value={editingTheme.colors.accent}
                  onChange={(value) => setEditingTheme(prev => ({
                    ...prev,
                    colors: { ...prev.colors, accent: value }
                  }))}
                />
                <ColorPicker
                  label="Background Color"
                  value={editingTheme.colors.background}
                  onChange={(value) => setEditingTheme(prev => ({
                    ...prev,
                    colors: { ...prev.colors, background: value }
                  }))}
                />
                <ColorPicker
                  label="Surface Color"
                  value={editingTheme.colors.surface}
                  onChange={(value) => setEditingTheme(prev => ({
                    ...prev,
                    colors: { ...prev.colors, surface: value }
                  }))}
                />
                <ColorPicker
                  label="Text Color"
                  value={editingTheme.colors.text}
                  onChange={(value) => setEditingTheme(prev => ({
                    ...prev,
                    colors: { ...prev.colors, text: value }
                  }))}
                />
              </div>

              {/* Color Preview */}
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Color Preview</h4>
                <div className="flex gap-2">
                  {Object.entries(editingTheme.colors).map(([key, color]) => (
                    <div key={key} className="text-center">
                      <div 
                        className="w-12 h-12 rounded-lg border"
                        style={{ backgroundColor: color }}
                      />
                      <Label className="text-xs">{key}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wallpaper" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Wallpaper & Background</h3>

              </div>

              <div className="space-y-4">
                <div>
                  <Label>Wallpaper Type</Label>
                  <Select
                    value={editingTheme.wallpaper?.type || 'color'}
                    onValueChange={(type: 'color' | 'gradient' | 'image') => {
                      setEditingTheme(prev => ({
                        ...prev,
                        wallpaper: { ...prev.wallpaper, type } as any
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Solid Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Image URL</SelectItem>

                    </SelectContent>
                  </Select>
                </div>

                {editingTheme.wallpaper?.type === 'color' && (
                  <ColorPicker
                    label="Background Color"
                    value={editingTheme.wallpaper.value}
                    onChange={(value) => setEditingTheme(prev => ({
                      ...prev,
                      wallpaper: { ...prev.wallpaper, value } as any
                    }))}
                  />
                )}

                {editingTheme.wallpaper?.type === 'gradient' && (
                  <div>
                    <Label>Gradient CSS</Label>
                    <Input
                      value={editingTheme.wallpaper.value}
                      onChange={(e) => setEditingTheme(prev => ({
                        ...prev,
                        wallpaper: { ...prev.wallpaper, value: e.target.value } as any
                      }))}
                      placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    />
                  </div>
                )}

                {editingTheme.wallpaper?.type === 'image' && (
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={editingTheme.wallpaper.value}
                      onChange={(e) => setEditingTheme(prev => ({
                        ...prev,
                        wallpaper: { ...prev.wallpaper, value: e.target.value } as any
                      }))}
                      placeholder="https://example.com/wallpaper.jpg"
                    />
                  </div>
                )}



                <div>
                  <Label>Wallpaper Opacity: {Math.round((editingTheme.wallpaper?.opacity || 1) * 100)}%</Label>
                  <Slider
                    value={[(editingTheme.wallpaper?.opacity || 1) * 100]}
                    onValueChange={([value]) => {
                      setEditingTheme(prev => ({
                        ...prev,
                        wallpaper: { ...prev.wallpaper, opacity: value / 100 } as any
                      }));
                    }}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="effects" className="space-y-6">
              <h3 className="text-lg font-semibold">Visual Effects</h3>

              <div className="grid gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Glass Effect</Label>
                    <p className="text-sm text-muted-foreground">Add translucent glass-like appearance</p>
                  </div>
                  <Switch
                    checked={editingTheme.effects.glassEffect}
                    onCheckedChange={(checked) => setEditingTheme(prev => ({
                      ...prev,
                      effects: { ...prev.effects, glassEffect: checked }
                    }))}
                  />
                </div>

                <div>
                  <Label>Blur Amount: {editingTheme.effects.blur}px</Label>
                  <Slider
                    value={[editingTheme.effects.blur]}
                    onValueChange={([value]) => setEditingTheme(prev => ({
                      ...prev,
                      effects: { ...prev.effects, blur: value }
                    }))}
                    max={20}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Shadows</Label>
                    <p className="text-sm text-muted-foreground">Enable drop shadows on elements</p>
                  </div>
                  <Switch
                    checked={editingTheme.effects.shadows}
                    onCheckedChange={(checked) => setEditingTheme(prev => ({
                      ...prev,
                      effects: { ...prev.effects, shadows: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Animations</Label>
                    <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                  </div>
                  <Switch
                    checked={editingTheme.effects.animations}
                    onCheckedChange={(checked) => setEditingTheme(prev => ({
                      ...prev,
                      effects: { ...prev.effects, animations: checked }
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              <h3 className="text-lg font-semibold">Theme Management</h3>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={exportCurrentTheme}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Theme
                </Button>
                <Button variant="outline" onClick={() => document.getElementById('theme-import')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Theme
                </Button>
                <input
                  id="theme-import"
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={importThemeFile}
                />
                <Button variant="outline" onClick={resetToOriginal}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                {editingTheme.type === 'custom' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => deleteTheme(editingTheme.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Theme
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Available Themes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <Card 
                      key={theme.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        theme.id === currentTheme.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setTheme(theme)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm">{theme.name}</CardTitle>
                            <Badge variant={theme.type === 'preset' ? 'default' : 'secondary'}>
                              {theme.type}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTheme(theme);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-1">
                          {Object.entries(theme.colors).slice(0, 5).map(([key, color]) => (
                            <div
                              key={key}
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: color }}
                              title={key}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}