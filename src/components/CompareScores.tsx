import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Minus } from "lucide-react"
import { SUB_SCORE_UI } from "@/components/score-meta"
import { getGradeBadgeStyle, getSubScoreColor } from "../lib/score-style"
import { mapScoreToGrade } from "../lib/scoring"
import type { Grade, SubScores } from "../lib/scoring"

interface Score {
  letter: Grade
  points: number
}

interface CompareScoresProps {
  scoresA: SubScores
  scoresB: SubScores
  totalA: Score
  totalB: Score
  nameA: string
  nameB: string
}

export function CompareScores({
  scoresA,
  scoresB,
  totalA,
  totalB,
  nameA,
  nameB,
}: CompareScoresProps) {
  const winnerA = totalA.points > totalB.points
  const winnerB = totalB.points > totalA.points
  const isTie = totalA.points === totalB.points

  return (
    <div className="space-y-6">
      {/* Total Score Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          className={`overflow-hidden border-l-2 ${winnerA ? "border-l-emerald-500" : isTie ? "border-l-sky-500" : "border-l-border"}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {nameA}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground tabular-nums">
                    {totalA.points}
                  </span>
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div
                  className={`border px-3 py-1.5 font-mono text-lg font-bold ${getGradeBadgeStyle(totalA.letter)}`}
                >
                  {totalA.letter}
                </div>
                {winnerA && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Trophy className="h-3 w-3" />
                    Leading
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`overflow-hidden border-l-2 ${winnerB ? "border-l-emerald-500" : isTie ? "border-l-sky-500" : "border-l-border"}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {nameB}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground tabular-nums">
                    {totalB.points}
                  </span>
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div
                  className={`border px-3 py-1.5 font-mono text-lg font-bold ${getGradeBadgeStyle(totalB.letter)}`}
                >
                  {totalB.letter}
                </div>
                {winnerB && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Trophy className="h-3 w-3" />
                    Leading
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-scores Breakdown */}
      <div className="space-y-3">
        {SUB_SCORE_UI.map(({ key, longLabel, icon: Icon }) => {
          const pointsA = scoresA[key]
          const pointsB = scoresB[key]
          const scoreA = { letter: mapScoreToGrade(pointsA), points: pointsA }
          const scoreB = { letter: mapScoreToGrade(pointsB), points: pointsB }

          const isABetter = scoreA.points > scoreB.points
          const isBBetter = scoreB.points > scoreA.points
          const isTieRow = scoreA.points === scoreB.points

          return (
            <div
              key={key}
              className="overflow-hidden border border-border bg-card"
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold tracking-wide text-foreground uppercase">
                  {longLabel}
                </span>
              </div>

              {/* Score Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Company A */}
                <div className="flex items-center gap-3 border-b border-border/50 p-3 sm:border-r sm:border-b-0">
                  <div className="w-12 shrink-0 text-right font-mono text-sm font-bold text-muted-foreground">
                    {scoreA.letter}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden bg-border/60">
                    <div
                      className={`h-full transition-all ${getSubScoreColor(scoreA.points)}`}
                      style={{ width: `${scoreA.points}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                    {scoreA.points}
                  </span>
                  {isABetter && (
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                  {isTieRow && (
                    <Minus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                </div>

                {/* Company B */}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-12 shrink-0 text-right font-mono text-sm font-bold text-muted-foreground">
                    {scoreB.letter}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden bg-border/60">
                    <div
                      className={`h-full transition-all ${getSubScoreColor(scoreB.points)}`}
                      style={{ width: `${scoreB.points}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                    {scoreB.points}
                  </span>
                  {isBBetter && (
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                  {isTieRow && (
                    <Minus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
