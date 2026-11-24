import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Award, Database, Scale, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DEFAULT_WEIGHTS } from "../lib/scoring"
import { APP_URL } from "../lib/site"

export const Route = createFileRoute("/methodology")({
  head: () => {
    const title = "AI Privacy Scoring Methodology | PrivacyGPT"
    const description =
      "How PrivacyGPT scores AI companies across six criteria: training defaults, opt-out ease, retention, deletion rights, third-party sharing, and human review."
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${APP_URL}/methodology` },
        { property: "og:image", content: `${APP_URL}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: `${APP_URL}/og-image.png` },
      ],
      links: [{ rel: "canonical", href: `${APP_URL}/methodology` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: APP_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Methodology",
                item: `${APP_URL}/methodology`,
              },
            ],
          }),
        },
      ],
    }
  },
  component: MethodologyPage,
})

const FIELDS = [
  {
    icon: Database,
    title: "Model Training by Default",
    description:
      "Does the platform use user conversations to train or fine-tune its models by default?",
    points: [
      [
        "Opt-in Default:",
        "Data is private until user consents (highest rating).",
      ],
      [
        "Opt-out Default:",
        "Platform trains by default, but user can disable it.",
      ],
      [
        "No Opt-out:",
        "Platform trains by default with no settings to disable.",
      ],
    ],
  },
  {
    icon: Scale,
    title: "Opt-Out Ease",
    description:
      "How difficult is it for an average consumer to stop the company from training on their data?",
    points: [
      [
        "Excellent:",
        "A single toggle in settings without losing chat history (e.g. Claude).",
      ],
      [
        "Moderate:",
        "A settings toggle but history is disabled (e.g. Google), or a dedicated form.",
      ],
      [
        "Poor:",
        "Requires emailing support, submitting a manual ticket, or is completely unavailable.",
      ],
    ],
  },
  {
    icon: Eye,
    title: "Human Review of Chats",
    description:
      "Are conversations read by human annotators or trust/safety moderators?",
    points: [
      [
        "",
        "Human review represents a distinct threat vector for data exposure (chats are cached, viewed by third-party contractors).",
      ],
      [
        "Opt-out configuration:",
        "Can users request exemptions from human review, or is it mandatory for safety monitoring?",
      ],
    ],
  },
] as const

const CONFIDENCE = [
  {
    chip: "Verified",
    chipClass: "chip--ok",
    title: "Verified",
    body: "Explicitly stated in the current public privacy policy, terms of service, or official help articles with direct link.",
  },
  {
    chip: "Inferred",
    chipClass: "chip--cool",
    title: "Inferred",
    body: "Logically deduced from parent company policies, technical docs, or developer platforms, but not explicitly stated in consumer policies.",
  },
  {
    chip: "Review Needed",
    chipClass: "chip--signal",
    title: "Needs Review",
    body: "Contradictory information exists, policies have changed recently without official clarification, or data requires active human verification.",
  },
] as const

const WEIGHT_ROWS = [
  {
    key: "trainingWeight",
    label: "Default Model Training Disabled",
  },
  { key: "optOutWeight", label: "Ease of Opt-Out" },
  {
    key: "retentionWeight",
    label: "Data Retention Period",
  },
  {
    key: "deletionWeight",
    label: "Deletion Rights (chats & account)",
  },
  {
    key: "humanReviewWeight",
    label: "No Human Review of normal chats",
  },
  {
    key: "sharingWeight",
    label: "Third Party Sharing restrictions",
  },
] as const

const RULES = [
  {
    title: "1. Model Training by Default",
    points: [
      ["100 pts", "Private by default (no training on user chats)."],
      ["0 pts", "Trains by default (requires opt-out)."],
    ],
  },
  {
    title: "2. Opt-Out Ease",
    points: [
      ["100 pts", "Settings toggle or already private."],
      ["40 pts", "Requires manual form submission or is restricted to EU/UK."],
      ["0 pts", "No opt-out available."],
    ],
  },
  {
    title: "3. Data Retention Period",
    points: [
      ["100 pts", "Zero retention (chats deleted immediately)."],
      ["80 pts", "Short retention (under 30 days, e.g., when history is off)."],
      ["50 pts", "Medium retention (30 days to 18 months)."],
      ["0 pts", "Long, indefinite, or 5-year research retention."],
    ],
  },
  {
    title: "4. Deletion Rights",
    points: [
      ["100 pts", "Full account & thread deletion processed within 30 days."],
      [
        "50 pts",
        "Partial deletion (e.g., chats are deleted but model-ingested training posts cannot be purged).",
      ],
      ["0 pts", "No deletion requests honored."],
    ],
  },
  {
    title: "5. Third-Party Sharing",
    points: [
      ["100 pts", "Stored in isolated customer VPC, zero third-party sharing."],
      [
        "85 pts",
        "Shared with infrastructure/model providers under strict non-training, security contracts.",
      ],
      [
        "20 pts",
        "Shared for targeted advertising or across general consumer platforms.",
      ],
    ],
  },
  {
    title: "6. Human Review of Chats",
    points: [
      ["100 pts", "No human review."],
      [
        "80 pts",
        "Human review is restricted to abuse/security flags or safety reports.",
      ],
      [
        "30 pts",
        "Chats are sampled and reviewed for model annotation/improvement.",
      ],
    ],
  },
] as const

function MethodologyPage() {
  return (
    <main className="shell py-8">
      <div className="mx-auto w-full max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="-ml-3 gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Tracker
          </Link>
        </Button>

        {/* The document's head: one title, one line. */}
        <header className="mt-6 border-b border-rule pb-10">
          <h1>Tracker Methodology</h1>
          <p className="mt-4 max-w-[52ch] text-lead text-ink-2">
            How we analyze, score, and verify the privacy policies of AI
            platforms.
          </p>
        </header>

        {/* The three pillars, stated once as a band. */}
        <section
          aria-labelledby="pillars"
          className="mt-10 border-b border-rule pb-10"
        >
          <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-16">
            <h2 id="pillars" className="text-title">
              <Award className="mb-3 h-5 w-5 text-muted" aria-hidden="true" />
              Grounded in primary evidence
            </h2>
            <p className="text-lead text-ink-2">
              PrivacyGPT is built on three core pillars:{" "}
              <strong className="font-medium text-ink">
                falsifiability, visible citations, and strict neutrality
              </strong>
              . Unlike static review blogs, we do not guess or rely on hearsay.
              Every data point in our tracker is mapped to a specific clause in
              the company’s publicly available legal terms and cited with a
              clickable direct URL.
            </p>
          </div>
        </section>

        {/* The fields, each a question and its grading. */}
        <section aria-labelledby="fields" className="mt-16">
          <div className="head-block">
            <h2 id="fields">Core assessment fields</h2>
            <p>
              The questions every entry answers, and how each answer is graded.
            </p>
          </div>

          <div className="border-t border-rule">
            {FIELDS.map((field) => {
              const Icon = field.icon
              return (
                <div
                  key={field.title}
                  className="grid gap-3 border-b border-rule py-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-8"
                >
                  <h3 className="flex items-start gap-2 text-md font-medium">
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted"
                      aria-hidden="true"
                    />
                    {field.title}
                  </h3>
                  <div>
                    <p className="text-ink-2">{field.description}</p>
                    <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground">
                      {field.points.map(([lead, rest]) => (
                        <li key={lead + rest}>
                          {lead && (
                            <>
                              <strong className="font-medium text-ink">
                                {lead}
                              </strong>{" "}
                            </>
                          )}
                          {rest}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* The verification labels, three cells on one surface. */}
        <section aria-labelledby="confidence" className="mt-16">
          <div className="head-block">
            <h2 id="confidence">Confidence & verification ratings</h2>
            <p>
              To remain honest, we label the verification source and confidence
              levels for every entity in the tracker.
            </p>
          </div>

          <div className="panels sm:grid-cols-3">
            {CONFIDENCE.map((level) => (
              <div key={level.title} className="p-5">
                <span className={`chip ${level.chipClass}`}>{level.chip}</span>
                <h3 className="mt-3 text-md font-medium">{level.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {level.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The rubric: weights, scoring rules, formula. */}
        <section aria-labelledby="rubric" className="mt-16">
          <div className="head-block">
            <h2 id="rubric">Transparency rubric & point system</h2>
            <p>
              We compute a normalized score (0 to 100) based on weighted
              category scores.
            </p>
          </div>

          <div>
            <h3 className="text-md font-medium">Default weights</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="reg">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col" className="text-right">
                      Default Weight
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {WEIGHT_ROWS.map((row) => (
                    <tr key={row.key}>
                      <td>{row.label}</td>
                      <td className="num text-right">
                        {DEFAULT_WEIGHTS[row.key]}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-md font-medium">Category scoring rules</h3>
            <div className="mt-3 border-t border-rule">
              {RULES.map((rule) => (
                <div
                  key={rule.title}
                  className="grid gap-3 border-b border-rule py-5 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:gap-8"
                >
                  <h4 className="text-md font-medium text-ink">{rule.title}</h4>
                  <ul className="space-y-1.5">
                    {rule.points.map(([points, text]) => (
                      <li
                        key={points + text}
                        className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 text-sm"
                      >
                        <span className="measured text-ink">{points}</span>
                        <span className="text-muted-foreground">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-deep mt-8 p-5">
            <div className="label mb-2">Calculation formula</div>
            <code className="measured block text-sm break-words text-ink">
              Total Score = (Σ (Category Score * Category Weight)) / (Σ Weights)
            </code>
          </div>
        </section>
      </div>
    </main>
  )
}
