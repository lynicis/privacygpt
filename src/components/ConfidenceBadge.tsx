import { Badge } from "@/components/ui/badge"
import type { Confidence } from "../lib/db/schema"

const SIZE_CLASS = {
  sm: "text-xs",
  md: "text-sm",
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
          className={`border-ok/40 bg-ok-soft font-medium text-ok ${sizeClass}`}
        >
          Verified
        </Badge>
      )
    case "inferred":
      return (
        <Badge
          variant="outline"
          className={`border-cool/40 bg-cool-soft font-medium text-cool ${sizeClass}`}
        >
          Inferred
        </Badge>
      )
    case "unverified":
      return (
        <Badge
          variant="outline"
          className={`border-signal/40 bg-signal-soft font-medium text-signal ${sizeClass}`}
        >
          Unverified
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className={`border-bad/40 bg-bad-soft font-medium text-bad ${sizeClass}`}
        >
          Needs review
        </Badge>
      )
  }
}
