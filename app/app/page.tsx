import { SectionHeader } from "@/components/ui-custom/SectionHeader";
import { EmptyState } from "@/components/ui-custom/EmptyState";

export default function OlympusPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionHeader
        title="Olympus"
        epithet="The Summit — command, clarity, control"
      />
      <EmptyState copy="The mountain awaits its first dispatch." />
    </div>
  );
}
