export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const responsiveClasses = {
  // Container classes
  container: {
    base: 'w-full mx-auto px-4',
    sm: 'sm:px-6',
    md: 'md:px-8',
    lg: 'lg:max-w-7xl lg:px-12',
    xl: 'xl:px-16',
  },
  
  // Grid layouts
  grid: {
    responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    fourColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  },
  
  // Text sizing
  text: {
    heading: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    subheading: 'text-lg sm:text-xl md:text-2xl',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm',
  },
  
  // Spacing
  padding: {
    section: 'py-8 sm:py-12 md:py-16 lg:py-20',
    card: 'p-4 sm:p-6 md:p-8',
    small: 'p-2 sm:p-3 md:p-4',
  },
  
  // Navigation
  nav: {
    desktop: 'hidden md:flex',
    mobile: 'flex md:hidden',
    responsive: 'flex flex-col md:flex-row',
  },
  
  // Buttons
  button: {
    responsive: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
    icon: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
  },
  
  // Modals and dialogs
  modal: {
    container: 'w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl',
    fullscreen: 'fixed inset-0 md:inset-4 md:rounded-lg',
  },
  
  // Sidebar
  sidebar: {
    mobile: 'fixed inset-y-0 left-0 w-64 transform -translate-x-full transition-transform duration-300 ease-in-out z-50',
    desktop: 'hidden md:flex md:flex-col md:w-64 lg:w-80',
  },
} as const;

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Hook for detecting screen size
export const useScreenSize = () => {
  if (typeof window === 'undefined') return 'lg'; // Default for SSR
  
  const width = window.innerWidth;
  
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
};

// Utility for responsive font sizes based on preferences
export const getResponsiveFontSize = (fontSize: string) => {
  const baseSizes = {
    'small': 'text-xs sm:text-sm md:text-base',
    'medium': 'text-sm sm:text-base md:text-lg',
    'large': 'text-base sm:text-lg md:text-xl',
    'extra-large': 'text-lg sm:text-xl md:text-2xl',
  };
  
  return baseSizes[fontSize as keyof typeof baseSizes] || baseSizes.medium;
};

// Utility for responsive spacing
export const getResponsiveSpacing = (size: 'small' | 'medium' | 'large') => {
  const spacings = {
    small: 'p-2 sm:p-3 md:p-4',
    medium: 'p-4 sm:p-6 md:p-8',
    large: 'p-6 sm:p-8 md:p-10 lg:p-12',
  };
  
  return spacings[size];
};