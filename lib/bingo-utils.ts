import SHA256 from "crypto-js/sha256"
import Hex from "crypto-js/enc-hex"

export function generateBingoCard(seed?: string): string[][] {
  try {
    // Create empty 5x5 card
    const card: string[][] = Array(5)
      .fill(null)
      .map(() => Array(5).fill(""))

    // Use the seed to create a deterministic card if provided
    const useSeed = seed || Math.random().toString()

    // Generate columns with appropriate number ranges
    // B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
    for (let col = 0; col < 5; col++) {
      const min = col * 15 + 1
      const max = min + 14
      const letter = "BINGO"[col]

      // Generate unique numbers for this column
      const usedNumbers = new Set<number>()
      for (let row = 0; row < 5; row++) {
        // Skip the center free space
        if (col === 2 && row === 2) {
          card[row][col] = "FREE"
          continue
        }

        // Use a deterministic approach based on the seed
        let num: number
        let attempts = 0
        do {
          // Create a hash based on the seed, column, row, and attempt number
          const hash = SHA256(`${useSeed}-${col}-${row}-${attempts}`).toString(Hex)

          // Convert the hash to a number in the appropriate range
          const hashNum = Number.parseInt(hash.substring(0, 8), 16)
          num = (hashNum % (max - min + 1)) + min
          attempts++
        } while (usedNumbers.has(num) && attempts < 100) // Prevent infinite loops

        usedNumbers.add(num)
        card[row][col] = `${letter}${num}`
      }
    }

    return card
  } catch (error) {
    console.error("Error generating bingo card:", error)
    // Return a fallback card in case of error
    return Array(5)
      .fill(null)
      .map((_, rowIndex) =>
        Array(5)
          .fill(null)
          .map((_, colIndex) => {
            if (rowIndex === 2 && colIndex === 2) return "FREE"
            const letter = "BINGO"[colIndex]
            const num = colIndex * 15 + rowIndex * 3 + 1
            return `${letter}${num}`
          }),
      )
  }
}

// Generate a random bingo number
export function generateRandomBingoNumber(calledNumbers: string[]): string | null {
  try {
    // Generate all possible bingo numbers
    const allPossibleNumbers = [
      ...Array.from({ length: 15 }, (_, i) => `B${i + 1}`),
      ...Array.from({ length: 15 }, (_, i) => `I${i + 16}`),
      ...Array.from({ length: 15 }, (_, i) => `N${i + 31}`),
      ...Array.from({ length: 15 }, (_, i) => `G${i + 46}`),
      ...Array.from({ length: 15 }, (_, i) => `O${i + 61}`),
    ]

    // Filter out already called numbers
    const availableNumbers = allPossibleNumbers.filter((num) => !calledNumbers.includes(num))

    if (availableNumbers.length === 0) {
      return null
    }

    // Pick a random number from available numbers
    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    return availableNumbers[randomIndex]
  } catch (error) {
    console.error("Error generating random bingo number:", error)
    return null
  }
}
