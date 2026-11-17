import { Lock, ShieldCheck, Trash2, Share2, UserCheck } from "lucide-react"
import type { ComponentType } from "react"
import { SUB_SCORE_META } from "../lib/scoring"
import type { SubScores } from "../lib/scoring"

const ICONS: Record<keyof SubScores, ComponentType<{ className?: string }>> = {
  trainingScore: Lock,
  optOutScore: ShieldCheck,
  retentionScore: Trash2,
  deletionScore: Trash2,
  sharingScore: Share2,
  humanReviewScore: UserCheck,
}

export const SUB_SCORE_UI = SUB_SCORE_META.map((meta) => ({
  ...meta,
  icon: ICONS[meta.key],
}))
