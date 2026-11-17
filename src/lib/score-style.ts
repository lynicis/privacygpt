export function getGradeBadgeStyle(grade: string) {
  if (grade.startsWith("A"))
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  if (grade.startsWith("B"))
    return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
  if (grade === "C")
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
}

export function getGradeBorderColor(grade: string) {
  if (grade.startsWith("A")) return "border-l-emerald-500"
  if (grade.startsWith("B")) return "border-l-sky-500"
  if (grade === "C") return "border-l-amber-500"
  return "border-l-red-500"
}

export function getSubScoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}
