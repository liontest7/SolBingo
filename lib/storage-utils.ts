// Utility functions for safer localStorage operations

/**
 * Safely gets an item from localStorage with error handling
 */
export function safeGetItem(key: string, fallback: any = null): any {
  try {
    const value = localStorage.getItem(key)
    if (!value) return fallback

    return JSON.parse(value)
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error)
    return fallback
  }
}

/**
 * Safely sets an item in localStorage with error handling
 */
export function safeSetItem(key: string, value: any): boolean {
  try {
    // Check if localStorage is available and has space
    if (!isLocalStorageAvailable()) {
      console.warn("localStorage is not available or full")
      return false
    }

    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error)

    // If it's a quota error, try to clear some space
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      clearOldData()
    }

    return false
  }
}

/**
 * Checks if localStorage is available and has space
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = "__storage_test__"
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Clears old data to free up space
 */
function clearOldData(): void {
  try {
    // Find and remove the oldest rooms
    const rooms = safeGetItem("bingo_rooms", [])
    if (Array.isArray(rooms) && rooms.length > 5) {
      // Keep only the 5 newest rooms
      const sortedRooms = rooms.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
      safeSetItem("bingo_rooms", sortedRooms)
    }
  } catch (error) {
    console.error("Error clearing old data:", error)
  }
}
