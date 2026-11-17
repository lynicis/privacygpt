import { Badge } from "@/components/ui/badge"
import type { Confidence } from "../lib/db/schema"

const SIZE_CLASS = {
  sm: "text-[10px]",
  md: "text-xs",
} as const

export function ConfidenceBadge({
  value,
  size = "sm",
}: {
  value: Confidence
  size?: keyof typeof SIZE_CLASS
}) {
  const sizeClass = SIZE_CLASS[size]

  switch (value) {
    case "verified_from_policy_text":
      return (
        <Badge
          variant="outline"
          className={`border-emerald-500/20 bg-emerald-500/5 font-semibold text-emerald-600 dark:text-emerald-400 ${sizeClass}`}
        >
          Verified
        </Badge>
      )
    case "inferred":
      return (
        <Badge variant="secondary" className={`font-semibold ${sizeClass}`}>
          Inferred
        </Badge>
      )
    case "unverified":
      return (
        <Badge
          variant="outline"
          className={`border-amber-500/20 bg-amber-500/5 font-semibold text-amber-600 dark:text-amber-400 ${sizeClass}`}
        >
          Unverified
        </Badge>
      )
    default:
      return (
        <Badge variant="destructive" className={`font-semibold ${sizeClass}`}>
          Needs Review
        </Badge>
      )
  }
}
