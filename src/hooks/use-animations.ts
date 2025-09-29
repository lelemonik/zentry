import { usePreferences } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';

// Animation classes that respect the user's animation preference
export const useAnimationClasses = () => {
  const { preferences } = usePreferences();
  
  const getAnimationClass = (animationClass: string, fallbackClass: string = '') => {
    return preferences.animationsEnabled ? animationClass : fallbackClass;
  };
  
  const animationClasses = {
    // Transitions
    transition: preferences.animationsEnabled ? 'transition-all duration-200' : '',
    transitionColors: preferences.animationsEnabled ? 'transition-colors' : '',
    transitionShadow: preferences.animationsEnabled ? 'transition-shadow duration-200' : '',
    transitionOpacity: preferences.animationsEnabled ? 'transition-opacity' : '',
    transitionTransform: preferences.animationsEnabled ? 'transition-transform duration-300' : '',
    
    // Hover effects
    hoverScale: preferences.animationsEnabled ? 'hover:scale-105' : '',
    hoverShadow: preferences.animationsEnabled ? 'hover:shadow-lg' : '',
    groupHoverScale: preferences.animationsEnabled ? 'group-hover:scale-110' : '',
    
    // Custom animations
    slideUp: preferences.animationsEnabled ? 'animate-slide-up' : '',
    fadeIn: preferences.animationsEnabled ? 'animate-fade-in' : '',
    scaleIn: preferences.animationsEnabled ? 'animate-scale-in' : '',
    
    // Spin animations (keep for loading states)
    spin: 'animate-spin', // Always keep spin for loading indicators
    pulse: preferences.animationsEnabled ? 'animate-pulse' : '',
  };
  
  return {
    animationClasses,
    getAnimationClass,
    isAnimationEnabled: preferences.animationsEnabled
  };
};

// CSS class that can be applied to disable animations globally
export const getDisableAnimationsClass = (animationsEnabled: boolean) => {
  return animationsEnabled ? '' : 'disable-animations';
};

// Utility function to conditionally apply animation classes
export const withAnimation = (animationClass: string, animationsEnabled: boolean, fallback: string = '') => {
  return animationsEnabled ? animationClass : fallback;
};