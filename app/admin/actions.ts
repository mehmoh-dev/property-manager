"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  signInAdmin,
  signOutAdmin,
  isAdmin,
} from "@/lib/auth";
import {
  createProperty,
  updateProperty,
  deleteProperty,
  type PropertyInput,
} from "@/lib/properties";
import {
  setLeadStatus,
  setVisitStatus,
  createFollowUp,
  setFollowUpStatus,
} from "@/lib/leads";
import type { LeadStatus, VisitStatus, FollowUpStatus } from "@/lib/types";

async function assertAdmin() {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}

/* ------------------------------- Auth ---------------------------------- */

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    redirect("/admin/login?error=1");
  }
  await signInAdmin();
  redirect("/admin");
}

export async function logoutAction() {
  await signOutAdmin();
  redirect("/admin/login");
}

/* ---------------------------- Properties ------------------------------- */

function parsePropertyForm(formData: FormData): PropertyInput {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const num = (k: string) => Number(formData.get(k) ?? 0) || 0;
  const list = (k: string) =>
    str(k)
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

  return {
    title: str("title"),
    description: str("description"),
    type: str("type") || "house",
    listing_type: str("listing_type") || "sale",
    condition: str("condition") || "new",
    status: str("status") || "available",
    price: num("price"),
    city: str("city"),
    area: str("area"),
    address: str("address"),
    bedrooms: num("bedrooms"),
    bathrooms: num("bathrooms"),
    area_sqft: num("area_sqft"),
    features: list("features"),
    images: list("images"),
    featured: formData.get("featured") === "on",
  };
}

export async function createPropertyAction(formData: FormData) {
  await assertAdmin();
  const input = parsePropertyForm(formData);
  if (!input.title) throw new Error("Title is required");
  await createProperty(input);
  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  revalidatePath("/");
  redirect("/admin/properties");
}

export async function updatePropertyAction(id: number, formData: FormData) {
  await assertAdmin();
  const input = parsePropertyForm(formData);
  await updateProperty(id, input);
  revalidatePath("/admin/properties");
  revalidatePath(`/properties/${id}`);
  revalidatePath("/properties");
  revalidatePath("/");
  redirect("/admin/properties");
}

export async function deletePropertyAction(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  await deleteProperty(id);
  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  revalidatePath("/");
}

/* ------------------------------- Leads --------------------------------- */

export async function updateLeadStatusAction(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as LeadStatus;
  await setLeadStatus(id, status);
  revalidatePath("/admin/leads");
}

/* ------------------------------ Visits --------------------------------- */

export async function updateVisitStatusAction(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as VisitStatus;
  await setVisitStatus(id, status);
  revalidatePath("/admin/visits");
}

/* ---------------------------- Follow-ups ------------------------------- */

export async function createFollowUpAction(formData: FormData) {
  await assertAdmin();
  const lead_id = Number(formData.get("lead_id"));
  const due_date = String(formData.get("due_date"));
  const channel = String(formData.get("channel") || "call");
  const note = String(formData.get("note") || "");
  if (!lead_id || !due_date) throw new Error("Lead and due date are required");
  await createFollowUp({ lead_id, due_date, channel, note });
  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin/leads");
}

export async function updateFollowUpStatusAction(formData: FormData) {
  await assertAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as FollowUpStatus;
  await setFollowUpStatus(id, status);
  revalidatePath("/admin/follow-ups");
}
