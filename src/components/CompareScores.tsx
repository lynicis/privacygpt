import { SUB_SCORE_UI } from "@/components/score-meta"
import { getSubScoreColor } from "../lib/score-style"
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

function Side({
  name,
  total,
  leading,
}: {
  name: string
  total: Score
  leading: boolean
}) {
  return (
    <div className="p-6">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-md font-medium text-ink">{name}</span>
        <span className="measured text-sm text-muted">
          {leading ? "leading" : ""}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-4">
        <span className="reading text-[3.4rem]">{total.points}</span>
        <span className="pb-2">
          <span
            className={`inline-flex rounded-[4px] border px-2 py-0.5 ${getBadge(total.letter)}`}
          >
            <span className="measured text-md">{total.letter}</span>
          </span>
        </span>
      </div>
      <div className="label mt-1">of 100</div>
    </div>
  )
}

function getBadge(letter: string) {
  if (letter.startsWith("A")) return "border-ok/45 bg-ok-soft text-ok"
  if (letter.startsWith("B")) return "border-cool/45 bg-cool-soft text-cool"
  if (letter === "C") return "border-signal/45 bg-signal-soft text-signal"
  return "border-bad/45 bg-bad-soft text-bad"
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

  return (
    <div className="space-y-4">
      <div className="panels grid-cols-2">
        <Side name={nameA} total={totalA} leading={winnerA} />
        <Side name={nameB} total={totalB} leading={winnerB} />
      </div>

      <div className="panel overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 border-b border-rule px-4 py-2.5">
          <span className="label">Factor</span>
          <span className="label truncate">{nameA}</span>
          <span className="label truncate">{nameB}</span>
        </div>
        {SUB_SCORE_UI.map(({ key, label }) => (
          <div
            key={key}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] items-center gap-3 border-b border-rule px-4 py-3 last:border-b-0"
          >
            <span className="text-sm text-muted">{label}</span>
            <div className="flex items-center gap-2">
              <div className="bar flex-1">
                <span
                  className={getSubScoreColor(scoresA[key])}
                  style={{ width: `${scoresA[key]}%` }}
                />
              </div>
              <span className="measured w-10 text-right text-sm text-ink-2">
                {mapScoreToGrade(scoresA[key])}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bar flex-1">
                <span
                  className={getSubScoreColor(scoresB[key])}
                  style={{ width: `${scoresB[key]}%` }}
                />
              </div>
              <span className="measured w-10 text-right text-sm text-ink-2">
                {mapScoreToGrade(scoresB[key])}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
