import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  ensureHeaderFieldGroups,
  saveHeaderGroupList,
  getHeaderFieldEntries,
  type RegistryGroup,
  type RegistryFieldConfig,
} from "@/lib/registry-groups";
import { HeaderGroupManager as HeaderGroupManagerComponent } from "@/components/registry/HeaderGroupManager";

const SCOPE = "student";

export default function HeaderGroupManager() {
  const [groups, setGroups] = useState<RegistryGroup[]>([]);
  const [allFields, setAllFields] = useState<RegistryFieldConfig[]>([]);

  useEffect(() => {
    setGroups(ensureHeaderFieldGroups(SCOPE));
    setAllFields(getHeaderFieldEntries(SCOPE));
  }, []);

  function handleGroupsChange(nextGroups: RegistryGroup[]) {
    setGroups(nextGroups);
    saveHeaderGroupList(SCOPE, nextGroups);
  }

  function handleFieldsChange(nextFields: RegistryFieldConfig[]) {
    setAllFields(nextFields);
    try { localStorage.setItem(`sms.header-group-fields.${SCOPE}.v1`, JSON.stringify(nextFields)); } catch {}
  }

  return (
    <div className="flex flex-col h-full header-registry-group-manager">
      <PageHeader
        title="Header Group Manager"
        subtitle="Organise registry fields into logical groups. Drag rows to reorder."
      />
      <HeaderGroupManagerComponent
        groups={groups}
        fields={allFields}
        onGroupsChange={handleGroupsChange}
        onFieldsChange={handleFieldsChange}
      />
    </div>
  );
}
