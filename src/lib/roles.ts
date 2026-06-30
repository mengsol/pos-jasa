// Pure role helpers — safe to import in both client and server components.

export const SUPERADMIN_USERNAME = 'SoL_admin'

// admin-or-higher (admin & superadmin share full admin access)
export function isAdminRole(role?: string | null): boolean {
  return role === 'admin' || role === 'superadmin'
}

// only the single superadmin (branding & top-level privileges)
export function isSuperadminRole(role?: string | null): boolean {
  return role === 'superadmin'
}
