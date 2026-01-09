"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NumberCallerProps {
  currentNumber: string | null
  calledNumbers: string[]
  onCallNumber: () => void
  onNewGame: () => void
  gameStarted: boolean
}

export default function NumberCaller({
  currentNumber,
  calledNumbers,
  onCallNumber,
  onNewGame,
  gameStarted,
}: NumberCallerProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4">Number Caller</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="text-6xl font-bold mb-4 h-24 flex items-center justify-center">{currentNumber || "?"}</div>

        <div className="flex gap-4">
          <Button onClick={onCallNumber} size="lg" className="px-8">
            Call Number
          </Button>

          <Button onClick={onNewGame} variant="outline" size="lg">
            New Game
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Called Numbers</h3>
        {gameStarted ? (
          <ScrollArea className="h-[200px] border rounded-md p-4">
            <div className="flex flex-wrap gap-2">
              {calledNumbers.map((number, index) => (
                <div key={index} className="bg-muted px-2 py-1 rounded-md text-sm font-medium">
                  {number}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-muted-foreground">No numbers called yet. Click "Call Number" to start the game.</p>
        )}
      </div>
    </div>
  )
}
