interface CompareSectionProps {
  label: string
  valueA: string
  valueB: string
  booleanA?: boolean
  booleanB?: boolean
  booleanGood?: boolean
}

export function CompareSection({
  label,
  valueA,
  valueB,
  booleanA,
  booleanB,
  booleanGood = false,
}: CompareSectionProps) {
  const state = (value: boolean, goodIs: boolean) => {
    const positive = goodIs ? value : !value
    return positive ? "chip--ok" : goodIs ? "chip--bad" : "chip--signal"
  }

  return (
    <div className="border-b border-rule">
      <h3 className="px-0 pt-5 pb-3 text-sm font-medium text-ink-2">{label}</h3>
      <div className="grid gap-px overflow-hidden rounded-[6px] border border-rule bg-rule sm:grid-cols-2">
        <div className="bg-paper-2 p-4">
          {booleanA !== undefined && (
            <span className={`chip ${state(booleanA, booleanGood)}`}>
              {booleanA ? "Yes" : "No"}
            </span>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {valueA}
          </p>
        </div>
        <div className="bg-paper-2 p-4">
          {booleanB !== undefined && (
            <span className={`chip ${state(booleanB, booleanGood)}`}>
              {booleanB ? "Yes" : "No"}
            </span>
          )}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {valueB}
          </p>
        </div>
      </div>
    </div>
  )
}
