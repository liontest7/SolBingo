import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function Roadmap() {
  const phases = [
    {
      title: "Phase 1: Launch",
      items: ["Initial game development", "Website launch", "Community building", "Token creation"],
      status: "completed",
    },
    {
      title: "Phase 2: Growth",
      items: ["Token public sale", "Liquidity pool creation", "Marketing campaigns", "Game feature expansion"],
      status: "in-progress",
    },
    {
      title: "Phase 3: Expansion",
      items: [
        "Mobile app development",
        "Additional game modes",
        "Partnerships with other projects",
        "Staking mechanisms",
      ],
      status: "upcoming",
    },
    {
      title: "Phase 4: Ecosystem",
      items: ["Governance implementation", "Multi-chain support", "Tournament system", "Developer API"],
      status: "upcoming",
    },
  ]

  return (
    <Card className="border-2 border-purple-500/10 hover:border-purple-500/30 transition-all duration-300 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        <CardTitle className="text-2xl">Project Roadmap</CardTitle>
        <CardDescription className="text-base">Development timeline and milestones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {phases.map((phase, index) => (
            <div key={index} className="relative pl-8 pb-8 border-l border-muted last:border-0 last:pb-0">
              <div
                className={`absolute left-[-8px] w-5 h-5 rounded-full border-2 ${
                  phase.status === "completed"
                    ? "bg-green-500 border-green-600"
                    : phase.status === "in-progress"
                      ? "bg-blue-500 border-blue-600"
                      : "bg-muted border-muted-foreground"
                }`}
              />
              <h3 className="text-xl font-semibold mb-2">{phase.title}</h3>
              <div className="flex items-center mb-3">
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    phase.status === "completed"
                      ? "bg-green-500/20 text-green-700 border border-green-300"
                      : phase.status === "in-progress"
                        ? "bg-blue-500/20 text-blue-700 border border-blue-300"
                        : "bg-muted/50 text-muted-foreground border border-gray-300"
                  }`}
                >
                  {phase.status === "completed"
                    ? "Completed"
                    : phase.status === "in-progress"
                      ? "In Progress"
                      : "Upcoming"}
                </span>
              </div>
              <ul className="space-y-2">
                {phase.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-base flex items-start">
                    <span className="mr-2 text-purple-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
