import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useId } from "react"
import type { companies } from "@/lib/db/schema"

type Company = typeof companies.$inferSelect

interface CompanySelectProps {
  companies: Company[]
  value: string
  onChange: (value: string) => void
  disabledCompany?: string
  label: string
  placeholder?: string
}

export function CompanySelect({
  companies,
  value,
  onChange,
  disabledCompany,
  label,
  placeholder = "Select a company",
}: CompanySelectProps) {
  const selectedCompany = companies.find((c) => c.companyKey === value)
  const labelId = useId()

  return (
    <div className="space-y-2">
      <label id={labelId} className="label block">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-11 w-full border-rule-2 bg-paper-3"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem
              key={company.companyKey}
              value={company.companyKey}
              disabled={company.companyKey === disabledCompany}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ink">
                  {company.companyName}
                </span>
                <span className="text-sm text-muted">
                  {company.productName}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedCompany && (
        <p className="flex flex-wrap gap-2 pt-1">
          <span
            className={`chip ${selectedCompany.trainsOnDataByDefault ? "chip--bad" : "chip--ok"}`}
          >
            {selectedCompany.trainsOnDataByDefault
              ? "Trains by default"
              : "Training off"}
          </span>
          <span
            className={`chip ${selectedCompany.optOutAvailable ? "chip--ok" : "chip--bad"}`}
          >
            {selectedCompany.optOutAvailable ? "Opt-out" : "No opt-out"}
          </span>
        </p>
      )}
    </div>
  )
}
