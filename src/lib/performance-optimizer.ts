// Enhanced performance optimizer for instant loading
import { startTransition } from 'react';

interface PerformanceConfig {
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  enablePrefetching: boolean;
  enableServiceWorker: boolean;
}

class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: PerformanceConfig;
  private preloadedModules = new Map<string, any>();
  private componentCache = new Map<string, React.ComponentType>();

  constructor() {
    this.config = {
      enableImageOptimization: true,
      enableCodeSplitting: true,
      enablePrefetching: true,
      enableServiceWorker: true,
    };
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Preload critical components immediately
  async preloadCriticalComponents() {
    const criticalComponents = [
      () => import('@/components/TaskManager'),
      () => import('@/components/NotesManager'),
      () => import('@/components/ClassSchedule'),
      () => import('@/components/UserProfile'),
    ];

    console.log('🚀 Preloading critical components...');
    
    const promises = criticalComponents.map(async (importFn, index) => {
      try {
        const module = await importFn();
        const componentName = ['TaskManager', 'NotesManager', 'ClassSchedule', 'UserProfile'][index];
        this.preloadedModules.set(componentName, module);
        this.componentCache.set(componentName, module.default);
        console.log(`✅ Preloaded ${componentName}`);
      } catch (error) {
        console.error(`❌ Failed to preload component:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('🎯 Critical components preloaded');
  }

  // Get cached component or fallback to dynamic import
  getCachedComponent(componentName: string): React.ComponentType | null {
    return this.componentCache.get(componentName) || null;
  }

  // Optimize component rendering with React 18 features
  optimizeRender<T>(callback: () => T): Promise<T> {
    return new Promise((resolve) => {
      startTransition(() => {
        resolve(callback());
      });
    });
  }

  // Prefetch data for faster subsequent loads
  async prefetchRouteData(userId: string) {
    if (!userId) return;

    const prefetchPromises = [
      this.prefetchWithRetry(() => import('@/lib/universal-sync').then(m => m.loadTasks(userId))),
      this.prefetchWithRetry(() => import('@/lib/universal-sync').then(m => m.loadNotes(userId))),
      this.prefetchWithRetry(() => import('@/lib/universal-sync').then(m => m.loadSchedules(userId))),
    ];

    await Promise.allSettled(prefetchPromises);
  }

  private async prefetchWithRetry(fn: () => Promise<any>, maxRetries = 2): Promise<any> {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
      }
    }
  }

  // Initialize performance optimizations
  initialize() {
    // Preload critical resources
    this.preloadCriticalComponents();

    // Enable resource hints
    this.enableResourceHints();

    // Optimize images
    if (this.config.enableImageOptimization) {
      this.optimizeImages();
    }

    // Register service worker for caching
    if (this.config.enableServiceWorker && 'serviceWorker' in navigator) {
      this.registerServiceWorker();
    }
  }

  private enableResourceHints() {
    // Preload critical fonts
    const fontPreloads = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];

    fontPreloads.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'style';
      document.head.appendChild(link);
    });
  }

  private optimizeImages() {
    // Implement lazy loading for images
    const images = document.querySelectorAll('img[data-lazy]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.lazy) {
              img.src = img.dataset.lazy;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);
    } catch (error) {
      console.log('❌ Service Worker registration failed:', error);
    }
  }

  // Measure and log performance metrics
  measurePerformance() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          console.log('📊 Performance Metrics:');
          console.log(`  DOM Content Loaded: ${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`);
          console.log(`  Load Complete: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
          console.log(`  First Paint: ${performance.getEntriesByType('paint')[0]?.startTime}ms`);
          
          // Core Web Vitals
          this.measureCoreWebVitals();
        }, 0);
      });
    }
  }

  private measureCoreWebVitals() {
    // Measure Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log(`📈 LCP: ${lastEntry.startTime}ms`);
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // Measure First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const fidEntry = entry as any;
        if (fidEntry.processingStart) {
          console.log(`⚡ FID: ${fidEntry.processingStart - fidEntry.startTime}ms`);
        }
      });
    }).observe({ type: 'first-input', buffered: true });

    // Measure Cumulative Layout Shift (CLS)
    let clsScore = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      });
      console.log(`📐 CLS: ${clsScore}`);
    }).observe({ type: 'layout-shift', buffered: true });
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();