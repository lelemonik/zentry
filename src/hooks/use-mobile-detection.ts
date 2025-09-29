import { useState, useEffect } from 'react';

/**
 * Hook to detect mobile devices and screen sizes
 * Provides comprehensive mobile detection capabilities
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
    orientation: 'portrait' as 'portrait' | 'landscape'
  });
  const [touchDevice, setTouchDevice] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Update screen size
      setScreenSize({
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait'
      });
      
      // Mobile breakpoint (below 640px)
      setIsMobile(width < 640);
      
      // Tablet breakpoint (640px to 1024px)
      setIsTablet(width >= 640 && width < 1024);
      
      // Touch device detection
      setTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
      
      // PWA detection
      setPwaInstalled(window.matchMedia('(display-mode: standalone)').matches);
    };

    // Initial check
    checkDeviceType();

    // Listen for resize events
    window.addEventListener('resize', checkDeviceType);
    window.addEventListener('orientationchange', checkDeviceType);

    return () => {
      window.removeEventListener('resize', checkDeviceType);
      window.removeEventListener('orientationchange', checkDeviceType);
    };
  }, []);

  // Additional utility functions
  const isSmallScreen = screenSize.width < 480;
  const isLargeScreen = screenSize.width >= 1024;
  const isLandscape = screenSize.orientation === 'landscape';
  const isPortrait = screenSize.orientation === 'portrait';

  // Safe area detection for modern devices
  const hasSafeArea = () => {
    return CSS.supports('padding-top: env(safe-area-inset-top)');
  };

  // Viewport height adjustment for mobile browsers
  const getViewportHeight = () => {
    return window.visualViewport?.height || window.innerHeight;
  };

  return {
    isMobile,
    isTablet,
    isSmallScreen,
    isLargeScreen,
    touchDevice,
    pwaInstalled,
    screenSize,
    isLandscape,
    isPortrait,
    hasSafeArea,
    getViewportHeight
  };
};

/**
 * Hook for responsive class names based on screen size
 */
export const useResponsiveClasses = () => {
  const { isMobile, isTablet, isSmallScreen } = useMobileDetection();

  const getResponsiveClass = (classes: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    small?: string;
  }) => {
    if (isSmallScreen && classes.small) return classes.small;
    if (isMobile && classes.mobile) return classes.mobile;
    if (isTablet && classes.tablet) return classes.tablet;
    return classes.desktop || '';
  };

  const containerClass = isMobile 
    ? 'px-3 py-2' 
    : isTablet 
    ? 'px-4 py-3' 
    : 'px-6 py-4';

  const textClass = isMobile 
    ? 'text-sm' 
    : isTablet 
    ? 'text-base' 
    : 'text-lg';

  const spacingClass = isMobile 
    ? 'space-y-2' 
    : isTablet 
    ? 'space-y-3' 
    : 'space-y-4';

  return {
    getResponsiveClass,
    containerClass,
    textClass,
    spacingClass,
    isMobile,
    isTablet
  };
};