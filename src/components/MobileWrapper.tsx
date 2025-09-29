import React from 'react';
import { cn } from '@/lib/utils';
import { useMobileDetection, useResponsiveClasses } from '@/hooks/use-mobile-detection';

interface MobileWrapperProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
  enableSafeArea?: boolean;
  optimizeTouch?: boolean;
  reducedMotion?: boolean;
}

/**
 * Wrapper component that automatically applies mobile-friendly styles
 * and optimizations based on device detection
 */
export const MobileWrapper: React.FC<MobileWrapperProps> = ({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  enableSafeArea = true,
  optimizeTouch = true,
  reducedMotion = false
}) => {
  const { 
    isMobile, 
    isTablet, 
    touchDevice, 
    hasSafeArea, 
    pwaInstalled 
  } = useMobileDetection();
  
  const { getResponsiveClass } = useResponsiveClasses();

  const responsiveClass = getResponsiveClass({
    mobile: mobileClassName,
    tablet: tabletClassName,
    desktop: desktopClassName
  });

  const wrapperClasses = cn(
    className,
    responsiveClass,
    {
      // Safe area support
      'safe-top safe-bottom safe-left safe-right': enableSafeArea && hasSafeArea(),
      
      // Touch optimizations
      'touch-manipulation': optimizeTouch && touchDevice,
      
      // PWA optimizations
      'select-none': pwaInstalled,
      
      // Mobile-specific optimizations
      'overflow-x-hidden': isMobile,
      
      // Reduced motion for better performance on mobile
      'motion-reduce': reducedMotion || isMobile
    }
  );

  return (
    <div className={wrapperClasses}>
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  rounded?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
}

/**
 * Card component that automatically adjusts for mobile devices
 */
export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  padding = 'medium',
  shadow = 'medium',
  rounded = 'medium',
  hover = true
}) => {
  const { isMobile, isTablet } = useMobileDetection();

  const paddingClasses = {
    none: '',
    small: isMobile ? 'p-2' : isTablet ? 'p-3' : 'p-4',
    medium: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
    large: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8'
  };

  const shadowClasses = {
    none: '',
    small: 'shadow-sm',
    medium: 'shadow-md',
    large: 'shadow-lg'
  };

  const roundedClasses = {
    none: '',
    small: isMobile ? 'rounded-lg' : 'rounded-xl',
    medium: isMobile ? 'rounded-xl' : 'rounded-2xl',
    large: isMobile ? 'rounded-2xl' : 'rounded-3xl'
  };

  const cardClasses = cn(
    'bg-card border border-border',
    paddingClasses[padding],
    shadowClasses[shadow],
    roundedClasses[rounded],
    {
      'hover-lift transition-all duration-200': hover,
      'active:scale-[0.98]': isMobile && hover
    },
    className
  );

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

interface ResponsiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

/**
 * Button component optimized for mobile touch interactions
 */
export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  className,
  disabled = false,
  fullWidth = false
}) => {
  const { isMobile, touchDevice } = useMobileDetection();

  const baseClasses = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2';
  
  const sizeClasses = {
    small: isMobile ? 'px-3 py-2 text-sm min-h-[40px]' : 'px-4 py-2 text-sm',
    medium: isMobile ? 'px-4 py-3 text-base min-h-[44px]' : 'px-6 py-3 text-base',
    large: isMobile ? 'px-6 py-4 text-lg min-h-[48px]' : 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-transparent hover:bg-muted',
    ghost: 'bg-transparent hover:bg-muted'
  };

  const buttonClasses = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    {
      'w-full': fullWidth,
      'opacity-50 cursor-not-allowed': disabled,
      'active:scale-[0.96] touch-manipulation': touchDevice && !disabled,
      'hover:shadow-md': !isMobile && !disabled
    },
    className
  );

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      style={{ 
        // Prevent iOS zoom on tap
        fontSize: isMobile ? '16px' : undefined 
      }}
    >
      {children}
    </button>
  );
};

export default MobileWrapper;