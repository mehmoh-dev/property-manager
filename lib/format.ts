import type { PropertyType, ListingType, PropertyCondition } from "./types";

/**
 * Formats a price in PKR using compact lakh/crore notation, which is how
 * property prices are commonly quoted in the target market.
 */
export function formatPrice(value: number, listingType?: ListingType): string {
  const suffix = listingType === "rent" ? " /mo" : "";
  if (!value || value <= 0) return "Price on request";

  if (value >= 10000000) {
    const crore = value / 10000000;
    return `PKR ${trim(crore)} Cr${suffix}`;
  }
  if (value >= 100000) {
    const lakh = value / 100000;
    return `PKR ${trim(lakh)} Lac${suffix}`;
  }
  return `PKR ${value.toLocaleString("en-PK")}${suffix}`;
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment",
  villa: "Villa",
  plot: "Plot",
  commercial: "Commercial",
  office: "Office",
};

export const PROPERTY_TYPES: PropertyType[] = [
  "house",
  "apartment",
  "villa",
  "plot",
  "commercial",
  "office",
];

export function typeLabel(type: string): string {
  return PROPERTY_TYPE_LABELS[type as PropertyType] ?? type;
}

export const CONDITION_LABELS: Record<PropertyCondition, string> = {
  new: "Newly Built",
  under_construction: "Under Construction",
  old: "Resale / Old",
  renovated: "Renovated",
};

export const PROPERTY_CONDITIONS: PropertyCondition[] = [
  "new",
  "under_construction",
  "old",
  "renovated",
];

export function conditionLabel(condition: string): string {
  return CONDITION_LABELS[condition as PropertyCondition] ?? condition;
}

export function listingTypeLabel(listingType: string): string {
  return listingType === "rent" ? "For Rent" : "For Sale";
}

export function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
