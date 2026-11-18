export function getGradeBadgeStyle(grade: string) {
  if (grade.startsWith("A")) return "border-ok/45 bg-ok-soft text-ok"
  if (grade.startsWith("B")) return "border-cool/45 bg-cool-soft text-cool"
  if (grade === "C") return "border-signal/45 bg-signal-soft text-signal"
  return "border-bad/45 bg-bad-soft text-bad"
}

export function getGradeBorderColor(grade: string) {
  if (grade.startsWith("A")) return "border-l-ok"
  if (grade.startsWith("B")) return "border-l-cool"
  if (grade === "C") return "border-l-signal"
  return "border-l-bad"
}

export function getSubScoreColor(score: number) {
  if (score >= 80) return "bg-ok"
  if (score >= 50) return "bg-signal"
  return "bg-bad"
}
