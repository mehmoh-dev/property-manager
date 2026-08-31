// Shared domain types for the property management system.

export type PropertyType =
  | "house"
  | "apartment"
  | "villa"
  | "plot"
  | "commercial"
  | "office";

export type PropertyStatus = "available" | "under_offer" | "sold" | "rented";

export type ListingType = "sale" | "rent";

export type PropertyCondition =
  | "new"
  | "under_construction"
  | "old"
  | "renovated";

export interface Property {
  id: number;
  title: string;
  description: string;
  type: PropertyType;
  listing_type: ListingType;
  condition: PropertyCondition;
  status: PropertyStatus;
  price: number;
  city: string;
  area: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  features: string[];
  images: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = "new" | "qualified" | "unqualified" | "converted";

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_city: string | null;
  preferred_type: PropertyType | null;
  notes: string | null;
  status: LeadStatus;
  score: number;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export type VisitStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Visit {
  id: number;
  property_id: number;
  lead_id: number | null;
  name: string;
  email: string;
  phone: string;
  visit_date: string;
  visit_time: string;
  status: VisitStatus;
  notes: string | null;
  created_at: string;
  // Joined fields (optional)
  property_title?: string;
  property_city?: string;
}

export type FollowUpStatus = "pending" | "done" | "cancelled";

export interface FollowUp {
  id: number;
  lead_id: number;
  due_date: string;
  channel: string;
  note: string | null;
  status: FollowUpStatus;
  created_at: string;
  // Joined fields
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
}

export interface PropertyFilters {
  city?: string;
  type?: PropertyType;
  listingType?: ListingType;
  condition?: PropertyCondition;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  status?: PropertyStatus;
  q?: string;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
  sort?: "newest" | "price_asc" | "price_desc";
}

/** Buyer preferences captured up-front to personalize recommendations. */
export interface BuyerPreferences {
  city?: string;
  area?: string;
  listingType?: ListingType;
  type?: PropertyType;
  condition?: PropertyCondition;
  budgetMin?: number;
  budgetMax?: number;
  minBedrooms?: number;
}
