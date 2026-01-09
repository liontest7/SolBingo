import type React from "react"

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="relative">{children}</div>
}
