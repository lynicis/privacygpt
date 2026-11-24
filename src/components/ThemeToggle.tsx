import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import type { Theme } from "./ThemeProvider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-10 w-[116px] rounded-[6px] border border-rule bg-paper-2" />
    )
  }

  return (
    <Select value={theme} onValueChange={(val) => setTheme(val as Theme)}>
      <SelectTrigger
        aria-label="Color theme"
        className="h-10 w-[116px] rounded-[6px] border-rule-2 bg-paper-2 px-2.5 text-sm"
      >
        <SelectValue>
          <span className="flex items-center gap-1.5 font-medium">
            {theme === "light" && <Sun className="h-3.5 w-3.5 text-signal" />}
            {theme === "dark" && <Moon className="h-3.5 w-3.5 text-cool" />}
            {theme === "system" && (
              <Monitor className="h-3.5 w-3.5 text-muted" />
            )}
            <span className="capitalize">{theme}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[128px] rounded-[6px]">
        <SelectItem value="light">
          <span className="flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-signal" />
            <span>Light</span>
          </span>
        </SelectItem>
        <SelectItem value="dark">
          <span className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-cool" />
            <span>Dark</span>
          </span>
        </SelectItem>
        <SelectItem value="system">
          <span className="flex items-center gap-1.5">
            <Monitor className="h-3.5 w-3.5 text-muted" />
            <span>System</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
