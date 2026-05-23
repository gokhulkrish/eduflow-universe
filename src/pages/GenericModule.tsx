import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import { moduleConfigs } from "@/pages/module-configs";

export default function GenericModule({ slug }: { slug: string }) {
  const cfg = moduleConfigs[slug];
  if (!cfg) return null;
  return <ModulePlaceholder {...cfg} />;
}
