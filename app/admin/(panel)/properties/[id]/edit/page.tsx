import { notFound } from "next/navigation";
import { getProperty } from "@/lib/properties";
import { PropertyForm } from "@/components/property-form";
import { updatePropertyAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
}: PageProps<"/admin/properties/[id]/edit">) {
  const { id } = await params;
  const property = await getProperty(Number(id));
  if (!property) notFound();

  const action = updatePropertyAction.bind(null, property.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Edit property</h1>
      <PropertyForm
        action={action}
        property={property}
        submitLabel="Save changes"
      />
    </div>
  );
}
