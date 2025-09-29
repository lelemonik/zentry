import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFontSize } from '@/contexts/FontSizeContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LanguageFontDemo() {
  const { language, t, availableLanguages } = useLanguage();
  const { fontSize, fontSizeClasses, availableSizes } = useFontSize();
  const { preferences } = usePreferences();
  const [isAnimating, setIsAnimating] = React.useState(false);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);
  const currentSize = availableSizes.find(size => size.value === fontSize);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", fontSizeClasses.heading)}>
          🎨 Language & Font Size Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={fontSizeClasses.text}>
            Current Language: {currentLanguage?.flag} {currentLanguage?.name}
          </Badge>
          <Badge variant="outline" className={fontSizeClasses.text}>
            Current Font Size: {currentSize?.label} ({currentSize?.px})
          </Badge>
          <Badge variant="outline" className={fontSizeClasses.text}>
            Animations: {preferences.animationsEnabled ? '✨ Enabled' : '🚫 Disabled'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className={cn("font-semibold", fontSizeClasses.text)}>
              Sample Translations:
            </h4>
            <div className="space-y-1">
              <p className={fontSizeClasses.text}>• {t('dashboard')}</p>
              <p className={fontSizeClasses.text}>• {t('tasks')}</p>
              <p className={fontSizeClasses.text}>• {t('notes')}</p>
              <p className={fontSizeClasses.text}>• {t('schedule')}</p>
              <p className={fontSizeClasses.text}>• {t('settings')}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className={cn("font-semibold", fontSizeClasses.text)}>
              Font Size Classes:
            </h4>
            <div className="space-y-1">
              <p className={fontSizeClasses.small}>Small text sample</p>
              <p className={fontSizeClasses.text}>Regular text sample</p>
              <p className={fontSizeClasses.heading}>Heading text sample</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg space-y-3">
          <p className={cn("text-muted-foreground", fontSizeClasses.small)}>
            🎯 Language, font size, and animation preferences are applied immediately across the entire app.
            All changes are automatically saved and will persist between sessions.
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 2000);
              }}
              className={cn(
                "text-xs",
                preferences.animationsEnabled && "hover:scale-105 transition-transform duration-200"
              )}
            >
              Test Animation
            </Button>
            <div 
              className={cn(
                "w-3 h-3 rounded-full bg-primary",
                isAnimating && preferences.animationsEnabled && "animate-bounce",
                !preferences.animationsEnabled && "opacity-50"
              )}
            />
            <span className={cn("text-muted-foreground", fontSizeClasses.small)}>
              {preferences.animationsEnabled ? "Click to see animation" : "Animations are disabled"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}