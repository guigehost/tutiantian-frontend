// 简单的性能监控
export const reportPerformance = (metric: string, value: number) => {
  if (import.meta.env.PROD) {
    // 上报性能数据到监控服务
    console.log(`[Performance] ${metric}: ${value}ms`);
  }
};

// Core Web Vitals
export const initWebVitals = () => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming;
        reportPerformance('domContentLoaded', navEntry.domContentLoadedEventEnd);
        reportPerformance('load', navEntry.loadEventEnd);
      }
      if (entry.entryType === 'largest-contentful-paint') {
        reportPerformance('lcp', entry.startTime);
      }
    }
  });

  observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
};