"use client";

import { useEffect } from "react";

/**
 * Fires a single view-tracking request for a property. This records the view
 * against the visitor's session so the recommendation engine can suggest
 * similar properties based on what they've looked at.
 */
export function ViewTracker({ propertyId }: { propertyId: number }) {
  useEffect(() => {
    const key = `viewed_${propertyId}`;
    // Avoid double-counting within the same tab session.
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    }).catch(() => {
      /* non-critical */
    });
  }, [propertyId]);

  return null;
}
