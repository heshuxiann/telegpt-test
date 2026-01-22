/* eslint-disable no-console */
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  maxRenderTime: number;
}

const performanceMetrics = new Map<string, PerformanceMetrics>();

/**
 * 性能监控 Hook
 * 用于检测组件渲染性能问题
 *
 * @param componentName - 组件名称
 * @param options - 配置选项
 * @param options.enabled - 是否启用监控（默认仅在开发环境启用）
 * @param options.logThreshold - 渲染次数超过此值时打印警告（默认 50）
 * @param options.slowRenderThreshold - 渲染时间超过此值（ms）时打印警告（默认 16）
 *
 * @example
 * function MyComponent() {
 *   usePerformanceMonitor('MyComponent', { logThreshold: 30 });
 *   // ...
 * }
 */
export function usePerformanceMonitor(
  componentName: string,
  options: {
    enabled?: boolean;
    logThreshold?: number;
    slowRenderThreshold?: number;
  } = {},
) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    logThreshold = 50,
    slowRenderThreshold = 16, // 60fps = 16.67ms per frame
  } = options;

  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);

  if (!enabled) return;

  // 记录渲染开始时间
  renderStartTime.current = performance.now();
  renderCount.current += 1;

  useEffect(() => {
    // 计算渲染时间
    const renderTime = performance.now() - renderStartTime.current;

    // 获取或创建性能指标
    const metrics = performanceMetrics.get(componentName) || {
      componentName,
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      maxRenderTime: 0,
    };

    // 更新指标
    metrics.renderCount = renderCount.current;
    metrics.lastRenderTime = renderTime;
    metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
    metrics.averageRenderTime =
      (metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) /
      metrics.renderCount;

    performanceMetrics.set(componentName, metrics);

    // 检测渲染次数过多
    if (renderCount.current % logThreshold === 0) {
      console.warn(
        `[Performance Warning] ${componentName} 已渲染 ${renderCount.current} 次`,
        {
          averageRenderTime: `${metrics.averageRenderTime.toFixed(2)}ms`,
          maxRenderTime: `${metrics.maxRenderTime.toFixed(2)}ms`,
          lastRenderTime: `${renderTime.toFixed(2)}ms`,
        },
      );
    }

    // 检测慢渲染
    if (renderTime > slowRenderThreshold) {
      console.warn(
        `[Performance Warning] ${componentName} 渲染缓慢: ${renderTime.toFixed(2)}ms (第 ${renderCount.current} 次渲染)`,
      );
    }
  });
}

/**
 * 获取所有性能指标
 */
export function getPerformanceMetrics(): Map<string, PerformanceMetrics> {
  return performanceMetrics;
}

/**
 * 打印性能报告
 */
export function printPerformanceReport() {
  console.group('📊 性能监控报告');

  const sortedMetrics = Array.from(performanceMetrics.entries()).sort(
    (a, b) => b[1].renderCount - a[1].renderCount,
  );

  sortedMetrics.forEach(([name, metrics]) => {
    console.log(`\n🔹 ${name}:`);
    console.log(`  渲染次数: ${metrics.renderCount}`);
    console.log(`  平均渲染时间: ${metrics.averageRenderTime.toFixed(2)}ms`);
    console.log(`  最大渲染时间: ${metrics.maxRenderTime.toFixed(2)}ms`);
    console.log(`  最近渲染时间: ${metrics.lastRenderTime.toFixed(2)}ms`);

    // 标记性能问题
    if (metrics.renderCount > 100) {
      console.warn(`  ⚠️ 渲染次数过多，可能存在不必要的重渲染`);
    }
    if (metrics.averageRenderTime > 16) {
      console.warn(`  ⚠️ 平均渲染时间较长，可能影响用户体验`);
    }
  });

  console.groupEnd();
}

/**
 * 清除性能指标
 */
export function clearPerformanceMetrics() {
  performanceMetrics.clear();
  console.log('✅ 性能指标已清除');
}

// 在浏览器控制台中暴露全局函数
if (typeof window !== 'undefined') {
  (window as any).__printPerformanceReport = printPerformanceReport;
  (window as any).__clearPerformanceMetrics = clearPerformanceMetrics;
  (window as any).__getPerformanceMetrics = getPerformanceMetrics;

  console.log(
    '💡 性能监控工具已加载。使用以下命令：\n' +
      '  __printPerformanceReport() - 打印性能报告\n' +
      '  __clearPerformanceMetrics() - 清除性能指标\n' +
      '  __getPerformanceMetrics() - 获取所有指标',
  );
}
