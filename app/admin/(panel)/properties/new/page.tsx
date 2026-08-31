import { PropertyForm } from "@/components/property-form";
import { createPropertyAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Add a property</h1>
      <PropertyForm action={createPropertyAction} submitLabel="Create property" />
    </div>
  );
}
