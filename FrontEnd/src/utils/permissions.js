import { SYSTEM_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from './allPermissions';

export { SYSTEM_PERMISSIONS };

export const PERMISSIONS = {
    ...SYSTEM_PERMISSIONS,
    // Legacy Mappings for Backward Compatibility
    MANAGE_USERS: SYSTEM_PERMISSIONS.ACTION_MANAGE_USERS,
    MANAGE_GROUPS: SYSTEM_PERMISSIONS.ACTION_MANAGE_GROUPS,
    MANAGE_LOANS: SYSTEM_PERMISSIONS.ACTION_MANAGE_LOANS,
    MANAGE_CONTRIBUTIONS: SYSTEM_PERMISSIONS.ACTION_MANAGE_CONTRIBUTIONS,
    MANAGE_FINES: SYSTEM_PERMISSIONS.ACTION_MANAGE_FINES,
    VIEW_REPORTS: SYSTEM_PERMISSIONS.ACTION_VIEW_REPORTS,
    VIEW_ANALYTICS: SYSTEM_PERMISSIONS.ACTION_VIEW_ANALYTICS,
    SEND_NOTIFICATIONS: SYSTEM_PERMISSIONS.ACTION_SEND_NOTIFICATIONS,
    VIEW_AUDIT_LOGS: SYSTEM_PERMISSIONS.ACTION_VIEW_AUDIT_LOGS,
    MANAGE_SYSTEM_SETTINGS: SYSTEM_PERMISSIONS.ACTION_MANAGE_SYSTEM_SETTINGS,
    SYSTEM_SETTINGS: SYSTEM_PERMISSIONS.ACTION_MANAGE_SYSTEM_SETTINGS, // Alias
    MANAGE_SUPPORT: SYSTEM_PERMISSIONS.ACTION_MANAGE_SUPPORT
};

/**
 * Checks if a user has a specific permission.
 * Logic:
 * 1. If explicit permission exists (true/false), use it.
 * 2. If no explicit permission, check defaults for the user's role.
 * 3. Default to FALSE (Deny) if not found in role defaults.
 * 
 * @param {Object} user - The user object with 'role' and 'permissions'
 * @param {string} permission - The permission key to check
 * @returns {boolean}
 */
/**
 * Checks if a user has a specific permission.
 * DISABLED: Always returns TRUE.
 * @returns {boolean} always true
 */
export const hasPermission = (user, permission) => {
    // Permission system disabled - allow everything
    return true;
};
