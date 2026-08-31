"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  PROPERTY_TYPES,
  typeLabel,
  PROPERTY_CONDITIONS,
  conditionLabel,
} from "@/lib/format";
import { CloseIcon, SparkleIcon } from "@/components/icons";

const STORAGE_KEY = "pms_prefs_done";

interface Prefs {
  listingType?: string;
  type?: string;
  condition?: string;
  city?: string;
  area?: string;
  budgetMin?: string;
  budgetMax?: string;
  minBedrooms?: string;
  name?: string;
  phone?: string;
}

/**
 * Intro modal that asks a few key questions before browsing so we can
 * personalize AI recommendations. Auto-shows once per visitor, re-openable via
 * a window "open-preferences" event, and hidden on admin pages.
 */
export function PreferenceModal() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({ listingType: "sale" });
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin || loaded.current) return;
    loaded.current = true;
    fetch("/api/preferences")
      .then((r) => r.json())
      .then((data) => {
        setCities(data.cities ?? []);
        const done = localStorage.getItem(STORAGE_KEY);
        if (!data.preferences && !done) setTimeout(() => setOpen(true), 700);
      })
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    function openHandler() {
      setStep(1);
      setOpen(true);
    }
    window.addEventListener("open-preferences", openHandler);
    return () => window.removeEventListener("open-preferences", openHandler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (isAdmin || !open) return null;

  const update = (patch: Partial<Prefs>) => setPrefs((p) => ({ ...p, ...patch }));

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  async function submit(goToResults: boolean) {
    setSaving(true);
    try {
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      localStorage.setItem(STORAGE_KEY, "1");
      setOpen(false);
      if (goToResults) {
        const params = new URLSearchParams();
        if (prefs.city) params.set("city", prefs.city);
        if (prefs.type) params.set("type", prefs.type);
        if (prefs.listingType) params.set("listingType", prefs.listingType);
        if (prefs.condition) params.set("condition", prefs.condition);
        if (prefs.budgetMin) params.set("minPrice", prefs.budgetMin);
        if (prefs.budgetMax) params.set("maxPrice", prefs.budgetMax);
        if (prefs.minBedrooms) params.set("minBedrooms", prefs.minBedrooms);
        router.push(`/properties?${params.toString()}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
      active
        ? "border-brand bg-brand-soft text-brand-dark shadow-sm"
        : "border-line bg-surface text-muted hover:border-slate-300"
    }`;

  return (
    <div className="animate-overlay fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-pop flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-lg sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <SparkleIcon />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ink">
                Find the right property, faster
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                A few quick questions so our AI can tailor your matches.
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-slate-100"
            aria-label="Close"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 px-5 pt-4 sm:px-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-brand" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <p className="field-label mb-2">What are you looking to do?</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button className={chip(prefs.listingType === "sale")} onClick={() => update({ listingType: "sale" })}>
                    Buy a property
                  </button>
                  <button className={chip(prefs.listingType === "rent")} onClick={() => update({ listingType: "rent" })}>
                    Rent a property
                  </button>
                </div>
              </div>
              <div>
                <p className="field-label mb-2">Property type</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {PROPERTY_TYPES.map((t) => (
                    <button key={t} className={chip(prefs.type === t)} onClick={() => update({ type: prefs.type === t ? undefined : t })}>
                      {typeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="field-label mb-2">Condition</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {PROPERTY_CONDITIONS.map((c) => (
                    <button key={c} className={chip(prefs.condition === c)} onClick={() => update({ condition: prefs.condition === c ? undefined : c })}>
                      {conditionLabel(c)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">City</label>
                  <input list="pref-cities" value={prefs.city ?? ""} onChange={(e) => update({ city: e.target.value })} className="field mt-1.5" placeholder="e.g. Karachi" />
                  <datalist id="pref-cities">
                    {cities.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="field-label">Area (optional)</label>
                  <input value={prefs.area ?? ""} onChange={(e) => update({ area: e.target.value })} className="field mt-1.5" placeholder="e.g. DHA" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Min budget (PKR)</label>
                  <input type="number" value={prefs.budgetMin ?? ""} onChange={(e) => update({ budgetMin: e.target.value })} className="field mt-1.5" placeholder="0" />
                </div>
                <div>
                  <label className="field-label">Max budget (PKR)</label>
                  <input type="number" value={prefs.budgetMax ?? ""} onChange={(e) => update({ budgetMax: e.target.value })} className="field mt-1.5" placeholder="Any" />
                </div>
              </div>
              <div>
                <label className="field-label">Minimum bedrooms</label>
                <select value={prefs.minBedrooms ?? ""} onChange={(e) => update({ minBedrooms: e.target.value })} className="field mt-1.5">
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}+</option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-muted">
                  Optional — leave your contact and an agent will reach out personally.
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-3">
                  <input value={prefs.name ?? ""} onChange={(e) => update({ name: e.target.value })} className="field" placeholder="Your name" />
                  <input value={prefs.phone ?? ""} onChange={(e) => update({ phone: e.target.value })} className="field" placeholder="Phone" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 border-t border-line p-4 sm:p-5">
          {step === 1 ? (
            <>
              <button onClick={dismiss} className="btn btn-ghost">
                Skip for now
              </button>
              <button onClick={() => setStep(2)} className="btn btn-primary">
                Continue
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="btn btn-ghost">
                ← Back
              </button>
              <div className="flex gap-2">
                <button onClick={() => submit(false)} disabled={saving} className="btn btn-outline">
                  Save
                </button>
                <button onClick={() => submit(true)} disabled={saving} className="btn btn-primary">
                  {saving ? "Saving…" : "See matches"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
