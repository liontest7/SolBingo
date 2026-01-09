// Simple performance monitoring utility
let lastMemoryUsage = 0
let lastTimestamp = Date.now()
const memoryWarningThreshold = 50 // MB
const timeWarningThreshold = 500 // ms

// Check if performance API is available
const hasPerformanceAPI = typeof performance !== "undefined" && typeof performance.memory !== "undefined"

export function monitorPerformance(operation: string) {
  try {
    // Skip if performance API is not available
    if (!hasPerformanceAPI) return

    const now = Date.now()
    const timeDiff = now - lastTimestamp

    // @ts-ignore - performance.memory is not in the standard TypeScript types
    const currentMemory = performance.memory?.usedJSHeapSize / (1024 * 1024) || 0
    const memoryDiff = currentMemory - lastMemoryUsage

    // Log if memory usage increased significantly or operation took too long
    if (memoryDiff > memoryWarningThreshold || timeDiff > timeWarningThreshold) {
      console.warn(`Performance warning for ${operation}: 
        Time: ${timeDiff}ms, 
        Memory: ${currentMemory.toFixed(2)}MB (${memoryDiff > 0 ? "+" : ""}${memoryDiff.toFixed(2)}MB)`)
    }

    lastMemoryUsage = currentMemory
    lastTimestamp = now
  } catch (error) {
    // Silently fail if monitoring causes issues
  }
}

// Function to clean up resources
export function cleanupResources() {
  try {
    // Force garbage collection if available (only works in some environments)
    if (typeof global !== "undefined" && global.gc) {
      global.gc()
    }
  } catch (error) {
    // Silently fail
  }
}
