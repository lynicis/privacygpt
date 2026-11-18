import { useState } from "react"
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { ThemeProvider } from "../components/ThemeProvider"
import { ThemeToggle } from "../components/ThemeToggle"
import { GitHubIcon } from "../components/GitHubIcon"

import appCss from "../styles.css?url"

import type { AnyRouter } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { APP_URL } from "../lib/site"

interface RouterContext {
  /** Attached right after router creation; absent during the constructor. */
  router?: AnyRouter
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        name: "theme-color",
        content: "#09090b",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      {
        title: "PrivacyGPT - AI Privacy Watchdog",
      },
      {
        name: "description",
        content:
          "Compare how major AI companies handle your data. See who trains on your chats, who deletes on request, and who shares with third parties.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: "PrivacyGPT",
      },
      {
        property: "og:title",
        content: "PrivacyGPT - AI Privacy Watchdog",
      },
      {
        property: "og:description",
        content:
          "PrivacyGPT monitors how major AI companies handle your conversational data. Compare privacy policies, training defaults, and opt-out mechanisms across AI platforms.",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        property: "og:image",
        content: `${APP_URL}/og-image.png`,
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:url",
        content: APP_URL,
      },
      {
        name: "twitter:title",
        content: "PrivacyGPT - AI Privacy Watchdog",
      },
      {
        name: "twitter:description",
        content:
          "PrivacyGPT monitors how major AI companies handle your conversational data. Compare privacy policies, training defaults, and opt-out mechanisms across AI platforms.",
      },
      {
        name: "twitter:image",
        content: `${APP_URL}/og-image.png`,
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon-180x180.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "PrivacyGPT",
          url: APP_URL,
          description:
            "Compare how major AI companies handle your data. See who trains on your chats, who deletes on request, and who shares with third parties.",
          potentialAction: {
            "@type": "SearchAction",
            target: `${APP_URL}/?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "PrivacyGPT",
          url: APP_URL,
          logo: `${APP_URL}/og-image.png`,
        }),
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  component: RootLayout,
  shellComponent: RootDocument,
})

const NAV_LINKS = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/methodology", label: "Methodology", exact: false },
  { to: "/compare", label: "Compare", exact: false },
  { to: "/changelog", label: "Changelog", exact: false },
  { to: "/faq", label: "FAQ", exact: false },
  { to: "/blog", label: "Blog", exact: false },
] as const

function RootLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-signal/25 selection:text-ink">
        {/* Navbar: one edge-aligned bar, solid ground, no glass. */}
        <header className="sticky top-0 z-[300] border-b border-rule bg-paper">
          <div className="shell flex h-16 items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-8">
              <Link
                to="/"
                aria-label="PrivacyGPT home"
                className="flex shrink-0 items-center gap-2.5"
              >
                <img
                  src="/logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-8 w-8"
                />
                <span className="font-display text-[17px] leading-none font-medium tracking-[-0.02em]">
                  PrivacyGPT
                </span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden items-center gap-5 lg:flex">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
                    activeProps={{
                      className:
                        "text-sm text-ink underline decoration-signal decoration-2 underline-offset-8",
                    }}
                    activeOptions={{ exact: link.exact }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href="https://github.com/lynicis/PrivacyGPT"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-10 w-10 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:bg-paper-2 hover:text-ink sm:inline-flex"
                aria-label="GitHub repository"
              >
                <GitHubIcon className="h-5 w-5" />
              </a>
              <ThemeToggle />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:bg-paper-2 hover:text-ink lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <nav className="border-t border-rule bg-paper lg:hidden">
              <div className="shell grid gap-1 py-3">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-[6px] px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:bg-paper-2 hover:text-ink"
                    activeProps={{
                      className:
                        "rounded-[6px] bg-paper-2 px-3 py-2.5 text-sm text-ink",
                    }}
                    activeOptions={{ exact: link.exact }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>

        {/* Footer: a mast, the wordmark over a two-column index. */}
        <footer className="border-t border-rule bg-paper-3">
          <div className="shell grid gap-12 py-16 md:grid-cols-[1.4fr_1fr] md:gap-16">
            <div className="max-w-md">
              <Link
                to="/"
                aria-label="PrivacyGPT home"
                className="inline-flex items-center gap-3"
              >
                <img src="/logo.png" alt="" width={40} height={40} className="h-9 w-9" />
                <span className="font-display text-2xl font-medium tracking-[-0.03em]">
                  PrivacyGPT
                </span>
              </Link>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                Monitoring how major AI companies handle conversational data.
                Open, verifiable, community-driven.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Privacy-first. No tracking. No cookies.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div>
                <h2 className="mb-4 text-sm font-medium text-ink">Product</h2>
                <ul className="space-y-2.5">
                  {NAV_LINKS.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="mb-4 text-sm font-medium text-ink">About</h2>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li>Data sourced from public privacy policies</li>
                  <li>Not affiliated with any AI company</li>
                  <li>
                    <a
                      href="https://github.com/lynicis/PrivacyGPT"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-rule-2 underline-offset-4 transition-colors duration-[var(--dur-micro)] hover:text-ink"
                    >
                      Source code
                    </a>
                  </li>
                </ul>
                <h2 className="mt-8 mb-4 text-sm font-medium text-ink">Legal</h2>
                <ul className="space-y-2.5">
                  {[
                    { to: "/privacy", label: "Privacy Policy" },
                    { to: "/terms", label: "Terms of Usage" },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-muted-foreground transition-colors duration-[var(--dur-micro)] hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="shell border-t border-rule py-6">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} PrivacyGPT</p>
              <p>
                An open watchdog for AI privacy, built by{" "}
                <a
                  href="https://lynicis.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-rule-2 underline-offset-4 transition-colors duration-[var(--dur-micro)] hover:text-ink"
                >
                  lynicis
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="overflow-x-clip"
      style={{ overflowX: "clip" }}
    >
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="overflow-x-clip" style={{ overflowX: "clip" }}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
