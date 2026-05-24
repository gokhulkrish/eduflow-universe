export interface InstituteIdentity {
  name: string;
  shortName?: string;
  nickname?: string;
  code?: string;
  logoUrl?: string;
  address?: string;
  district?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  headOfInstitute?: string;
  nodalOfficer?: string;
}

export interface HeaderConfig {
  key: string;
  label: string;
  visible: boolean;
  mappedTo?: string;
  aliasOf?: string;
  group?: string;
  order: number;
}

export interface ExperienceSettings {
  theme: 'light' | 'dark' | 'system';
  activityTrace: {
    enabled: boolean;
    startExpanded: boolean;
    autoCollapse: boolean;
    autoCollapseDelayMs: number;
    retainLimit: number;
    showUnreadBadge: boolean;
  };
  headers: {
    visibleColumns: string[];
    aliases: Record<string, string>;
    fieldGroups: Record<string, string[]>;
  };
  workspace: {
    sidebarCollapsed: boolean;
    focusMode: boolean;
  };
}
