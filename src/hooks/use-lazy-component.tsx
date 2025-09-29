import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { LoadingSpinner } from '@/components/ui/loading';

interface LazyComponentOptions {
  fallback?: ReactNode;
  preload?: boolean;
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) {
  const LazyComponent = lazy(importFn);
  
  // Preload the component if requested
  if (options.preload) {
    importFn();
  }
  
  const WrappedComponent = (props: any) => (
    <Suspense 
      fallback={
        options.fallback || (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
  
  // Add preload method
  WrappedComponent.preload = importFn;
  
  return WrappedComponent;
}

// Hook for managing component preloading
export function useLazyComponentPreloader() {
  const preloadComponent = (importFn: () => Promise<any>) => {
    // Only preload if not already loaded
    importFn().catch(() => {
      // Ignore preload errors
    });
  };
  
  return { preloadComponent };
}