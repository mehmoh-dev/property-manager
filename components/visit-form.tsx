"use client";

import { useState } from "react";

export function VisitForm({ propertyId }: { propertyId: number }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, ...data }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j.error ?? "Something went wrong");
      }
      setStatus("done");
      setMessage(
        j?.notified?.user
          ? "Your visit request is in! We've emailed you a confirmation and an agent will reach out to finalize the time."
          : "Your visit request has been received. An agent will contact you shortly to confirm."
      );
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="name" required placeholder="Your name" className="field" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="phone" required placeholder="Phone" className="field" />
        <input name="email" type="email" placeholder="Email (optional)" className="field" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="visit_date" type="date" required className="field" />
        <input name="visit_time" type="time" required className="field" />
      </div>
      <textarea
        name="notes"
        rows={2}
        placeholder="Anything specific you'd like to see?"
        className="field"
      />
      {status === "error" && <p className="text-sm text-red-600">{message}</p>}
      <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full">
        {status === "loading" ? "Scheduling…" : "Schedule a visit"}
      </button>
    </form>
  );
}
