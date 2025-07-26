// Performance monitoring utilities
import React from 'react';

export interface PerformanceMetrics {
    name: string;
    duration: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: Map<string, number> = new Map();
    private observers: PerformanceObserver[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeObservers();
        }
    }

    private initializeObservers() {
        // Observe navigation timing
        if ('PerformanceObserver' in window) {
            const navObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.entryType === 'navigation') {
                        const navEntry = entry as PerformanceNavigationTiming;
                        this.recordMetric('page-load', navEntry.loadEventEnd - navEntry.fetchStart);
                        this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
                        this.recordMetric('first-paint', navEntry.responseEnd - navEntry.fetchStart);
                    }
                });
            });

            try {
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.push(navObserver);
            } catch (e) {
                console.warn('Navigation timing observer not supported');
            }

            // Observe paint timing
            const paintObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    this.recordMetric(entry.name, entry.startTime);
                });
            });

            try {
                paintObserver.observe({ entryTypes: ['paint'] });
                this.observers.push(paintObserver);
            } catch (e) {
                console.warn('Paint timing observer not supported');
            }

            // Observe largest contentful paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.recordMetric('largest-contentful-paint', lastEntry.startTime);
            });

            try {
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(lcpObserver);
            } catch (e) {
                console.warn('LCP observer not supported');
            }

            // Observe cumulative layout shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.recordMetric('cumulative-layout-shift', clsValue);
            });

            try {
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(clsObserver);
            } catch (e) {
                console.warn('CLS observer not supported');
            }
        }
    }

    startTiming(name: string): void {
        this.metrics.set(name, performance.now());
    }

    endTiming(name: string): number | null {
        const startTime = this.metrics.get(name);
        if (startTime === undefined) {
            console.warn(`No start time found for metric: ${name}`);
            return null;
        }

        const duration = performance.now() - startTime;
        this.metrics.delete(name);
        this.recordMetric(name, duration);
        return duration;
    }

    recordMetric(name: string, value: number): void {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            // Send to Google Analytics if available
            (window as any).gtag('event', 'timing_complete', {
                name,
                value: Math.round(value),
            });
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`Performance metric - ${name}: ${value.toFixed(2)}ms`);
        }
    }

    measureComponent<T extends any[], R>(
        name: string,
        fn: (...args: T) => R
    ): (...args: T) => R {
        return (...args: T): R => {
            this.startTiming(name);
            const result = fn(...args);
            this.endTiming(name);
            return result;
        };
    }

    measureAsync<T extends any[], R>(
        name: string,
        fn: (...args: T) => Promise<R>
    ): (...args: T) => Promise<R> {
        return async (...args: T): Promise<R> => {
            this.startTiming(name);
            try {
                const result = await fn(...args);
                this.endTiming(name);
                return result;
            } catch (error) {
                this.endTiming(name);
                throw error;
            }
        };
    }

    getMetrics(): PerformanceMetrics[] {
        const entries = performance.getEntriesByType('measure');
        return entries.map(entry => ({
            name: entry.name,
            duration: entry.duration,
            timestamp: entry.startTime,
        }));
    }

    cleanup(): void {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.metrics.clear();
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
    return {
        startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
        endTiming: performanceMonitor.endTiming.bind(performanceMonitor),
        recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
        measureComponent: performanceMonitor.measureComponent.bind(performanceMonitor),
        measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    };
}

// Utility functions for common performance measurements
export function measureRender<P extends object>(
    Component: React.ComponentType<P>,
    displayName?: string
): React.ComponentType<P> {
    const WrappedComponent: React.FC<P> = (props) => {
        const componentName = displayName || Component.displayName || Component.name || 'Component';

        React.useEffect(() => {
            performanceMonitor.startTiming(`${componentName}-render`);
            return () => {
                performanceMonitor.endTiming(`${componentName}-render`);
            };
        });

        return React.createElement(Component, props);
    };

    WrappedComponent.displayName = `withPerformanceMonitor(${displayName || Component.displayName || Component.name})`;
    return WrappedComponent;
}

// Web Vitals measurement
export function measureWebVitals() {
    if (typeof window === 'undefined') return;

    // First Input Delay (FID)
    if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
                performanceMonitor.recordMetric('first-input-delay', entry.processingStart - entry.startTime);
            });
        });

        try {
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.warn('FID observer not supported');
        }
    }
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
    if (process.env.NODE_ENV !== 'development') return;

    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(async (script) => {
        const src = (script as HTMLScriptElement).src;
        if (src.includes('/_next/static/')) {
            try {
                const response = await fetch(src, { method: 'HEAD' });
                const size = parseInt(response.headers.get('content-length') || '0');
                totalSize += size;
                console.log(`Bundle: ${src.split('/').pop()} - ${(size / 1024).toFixed(2)}KB`);
            } catch (e) {
                console.warn('Could not fetch bundle size for:', src);
            }
        }
    });

    setTimeout(() => {
        console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
    }, 1000);
}