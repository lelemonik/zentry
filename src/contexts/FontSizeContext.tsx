import React, { createContext, useContext, useEffect } from 'react';
import { usePersistedState } from '@/hooks/use-local-storage';

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  fontSizeClasses: {
    text: string;
    heading: string;
    small: string;
  };
  availableSizes: { value: FontSize; label: string; px: string }[];
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const fontSizeMap = {
  small: {
    text: 'text-xs sm:text-sm',
    heading: 'text-sm sm:text-base',
    small: 'text-xs',
    px: '12px'
  },
  medium: {
    text: 'text-sm sm:text-base',
    heading: 'text-base sm:text-lg',
    small: 'text-xs sm:text-sm',
    px: '14px'
  },
  large: {
    text: 'text-base sm:text-lg',
    heading: 'text-lg sm:text-xl',
    small: 'text-sm sm:text-base',
    px: '16px'
  },
  'extra-large': {
    text: 'text-lg sm:text-xl',
    heading: 'text-xl sm:text-2xl',
    small: 'text-base sm:text-lg',
    px: '18px'
  }
};

export const availableFontSizes = [
  { value: 'small' as FontSize, label: 'Small', px: '12px' },
  { value: 'medium' as FontSize, label: 'Medium', px: '14px' },
  { value: 'large' as FontSize, label: 'Large', px: '16px' },
  { value: 'extra-large' as FontSize, label: 'Extra Large', px: '18px' }
];

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSize] = usePersistedState<FontSize>('appFontSize', 'medium');

  // Apply font size to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing font size classes
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-extra-large');
    
    // Add current font size class
    root.classList.add(`font-size-${fontSize}`);
    
    // Set CSS custom property for fine-grained control
    root.style.setProperty('--app-font-size', fontSizeMap[fontSize].px);
    
    // Apply base font size to body
    document.body.style.fontSize = fontSizeMap[fontSize].px;
  }, [fontSize]);

  const value = {
    fontSize,
    setFontSize,
    fontSizeClasses: fontSizeMap[fontSize],
    availableSizes: availableFontSizes
  };

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}

// Utility function to get font size classes for a component
export function getFontSizeClasses(fontSize: FontSize) {
  return fontSizeMap[fontSize];
}

// CSS-in-JS styles for font sizes
export const fontSizeStyles = {
  small: {
    fontSize: '12px',
    lineHeight: '1.4'
  },
  medium: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  large: {
    fontSize: '16px',
    lineHeight: '1.6'
  },
  'extra-large': {
    fontSize: '18px',
    lineHeight: '1.7'
  }
};