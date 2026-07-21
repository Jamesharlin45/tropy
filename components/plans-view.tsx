"use client"

import { Check, Diamond } from "lucide-react"
import { useApp } from "@/components/app-provider"

interface Plan {
  nameKey: string
  price: string
  periodKey: string
  featureKeys: string[]
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    nameKey: "plans.weekly",
    price: "$9",
    periodKey: "plans.perWeek",
    featureKeys: ["plans.feature.allVip", "plans.feature.accuracy", "plans.feature.priority"],
  },
  {
    nameKey: "plans.monthly",
    price: "$29",
    periodKey: "plans.perMonth",
    featureKeys: [
      "plans.feature.allVip",
      "plans.feature.accuracy",
      "plans.feature.priority",
      "plans.feature.history",
    ],
    popular: true,
  },
  {
    nameKey: "plans.season",
    price: "$149",
    periodKey: "plans.perSeason",
    featureKeys: [
      "plans.feature.allVip",
      "plans.feature.accuracy",
      "plans.feature.priority",
      "plans.feature.history",
      "plans.feature.earlyAccess",
    ],
  },
]

export function PlansView() {
  const { t } = useApp()
  return (
    <section aria-labelledby="plans-title" className="tp-fade-up">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--tp-accent)]/12 text-[var(--tp-accent)]">
          <Diamond className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2
          id="plans-title"
          className="font-display text-2xl font-bold text-[var(--tp-text)] text-balance"
        >
          {t("plans.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--tp-muted)] text-pretty">{t("plans.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.nameKey}
            className={`relative flex flex-col rounded-2xl border bg-[var(--tp-surface)] p-6 ${
              plan.popular
                ? "border-[var(--tp-accent)] shadow-[0_0_30px_-8px_rgba(var(--tp-glow),0.5)]"
                : "border-[var(--tp-border)]"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--tp-accent)] px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-[var(--tp-on-accent)]">
                {t("plans.popular")}
              </span>
            )}
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-[var(--tp-text)]">
              {t(plan.nameKey)}
            </h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-bold text-[var(--tp-text)]">
                {plan.price}
              </span>
              <span className="text-sm text-[var(--tp-muted)]">{t(plan.periodKey)}</span>
            </div>

            <ul className="mt-5 flex flex-1 flex-col gap-3">
              {plan.featureKeys.map((fk) => (
                <li key={fk} className="flex items-start gap-2 text-sm text-[var(--tp-text)]">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--tp-won)]/20 text-[var(--tp-won)]">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span className="text-pretty">{t(fk)}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem('tropy_vip_unlocked', 'true')
                  if ((window as Record<string, unknown>).AndroidBridge) {
                    ((window as Record<string, unknown>).AndroidBridge as { subscribe?: (plan: string) => void }).subscribe?.(plan.nameKey)
                  } else {
                    alert("Redirecting to Google Play Store Subscription...")
                  }
                }
              }}
              className={`tp-focus mt-6 rounded-xl px-4 py-3 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
                plan.popular
                  ? "bg-[var(--tp-accent)] text-[var(--tp-on-accent)] hover:bg-[var(--tp-accent-2)]"
                  : "border border-[var(--tp-accent)] text-[var(--tp-accent)] hover:bg-[var(--tp-accent)]/10"
              }`}
            >
              {t("plans.choose")}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-surface)]/60 p-4 text-center text-xs text-[var(--tp-muted)]">
        <svg className="size-5 shrink-0 text-[#01875f]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.609 1.814L13.792 12 3.61 22.186a2.373 2.373 0 0 1-.61-1.636V3.45c0-.626.223-1.205.609-1.636zM15.206 13.414l2.457 2.457-11.83 6.758 9.373-9.215zm0-2.828L5.833 1.371l11.83 6.758-2.457 2.457zm2.172 1.414l3.586-2.049a1.5 1.5 0 0 0 0-2.502l-3.586-2.049-2.228 2.228 2.228 2.372z"/>
        </svg>
        <span>Subscriptions are billed securely through your <strong>Google Play Store</strong> account.</span>
      </div>
    </section>
  )
}
