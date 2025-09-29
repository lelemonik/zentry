import React, { Component } from 'react';
import { performanceOptimizer } from '@/lib/performance-optimizer';

interface InstantLoadWrapperProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
}

interface InstantLoadWrapperState {
  hasError: boolean;
  isLoading: boolean;
}

// Ultra-fast loading wrapper with instant component switching
export class InstantLoadWrapper extends Component<InstantLoadWrapperProps, InstantLoadWrapperState> {
  private loadStartTime: number;

  constructor(props: InstantLoadWrapperProps) {
    super(props);
    this.state = {
      hasError: false,
      isLoading: true,
    };
    this.loadStartTime = performance.now();
  }

  static getDerivedStateFromError(): InstantLoadWrapperState {
    return { hasError: true, isLoading: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`❌ Component ${this.props.componentName} failed to load:`, error, errorInfo);
  }

  componentDidMount() {
    // Check if component is already cached
    const cachedComponent = performanceOptimizer.getCachedComponent(this.props.componentName);
    
    if (cachedComponent) {
      // Instant load from cache
      this.setState({ isLoading: false });
      const loadTime = performance.now() - this.loadStartTime;
      console.log(`⚡ ${this.props.componentName} loaded instantly from cache (${loadTime.toFixed(2)}ms)`);
    } else {
      // Still loading, but should be very fast due to preloading
      setTimeout(() => {
        this.setState({ isLoading: false });
        const loadTime = performance.now() - this.loadStartTime;
        console.log(`🚀 ${this.props.componentName} loaded (${loadTime.toFixed(2)}ms)`);
      }, 0);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 text-red-500">
          <div className="text-center">
            <p className="text-lg font-medium">⚠️ Component Error</p>
            <p className="text-sm text-gray-600">Failed to load {this.props.componentName}</p>
          </div>
        </div>
      );
    }

    if (this.state.isLoading && this.props.fallback) {
      return <>{this.props.fallback}</>;
    }

    return <>{this.props.children}</>;
  }
}

// Higher-order component for instant loading
export function withInstantLoad<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  fallback?: React.ReactNode
) {
  return function InstantLoadComponent(props: P) {
    return (
      <InstantLoadWrapper componentName={componentName} fallback={fallback}>
        <WrappedComponent {...props} />
      </InstantLoadWrapper>
    );
  };
}