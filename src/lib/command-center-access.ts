const COMMAND_CENTER_ROLES = new Set(["super_admin", "admin", "principal", "hod"]);

export function canOpenCommandCenter(roles: readonly string[] = []): boolean {
  return roles.some((role) => COMMAND_CENTER_ROLES.has(role));
}
