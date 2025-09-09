import { useSession } from "next-auth/react";
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Create an atom to store user preferences (simplified)
export const userPreferencesAtom = atomWithStorage<{ selectedRegion?: string }>('userPreferences', {});

/**
 * Simplified hook for user permission management - Mozambique version
 * 
 * Provides basic authentication and simplified permission structure
 * for Mozambique fishing data application.
 * 
 * TEMPORARILY MODIFIED FOR OPEN ACCESS - All users have full permissions
 */
export const useUserPermissions = () => {
  const { data: session } = useSession();
  const [userPreferences, setUserPreferences] = useAtom(userPreferencesAtom);
  
  // OPEN ACCESS MODE - Treat all users as having full access
  const isOpenAccess = true;
  
  // Simplified admin check - only check if user has admin role
  const isAdmin = isOpenAccess || (session?.user?.email && 
    (session.user.email.includes('admin') || 
     session?.user?.groups?.some((group: { name: string }) => group.name.toLowerCase() === 'admin')));
  
  // For Mozambique open access - all users are considered logged in
  const isLoggedIn = isOpenAccess || !!session?.user;
  
  // Get basic user information
  const userEmail = session?.user?.email || 'guest@mozambique-peskas.org';
  const userName = session?.user?.name || 'Guest User';
  
  /**
   * For Mozambique - all authenticated users can access all data
   * This removes the complex BMU-based restrictions from Mozambique version
   */
  const getAccessibleRegions = (allRegions: string[]): string[] => {
    // All users can see all regions in open access mode
    return allRegions;
  };
  
  /**
   * Simplified data access - no restrictions for Mozambique version
   */
  const canAccessData = () => {
    return true; // Open access
  };

  return {
    // User information
    userEmail,
    userName,
    isLoggedIn,
    isAdmin,
    
    // User preferences
    userPreferences,
    setUserPreferences,
    
    // Simplified helper functions
    getAccessibleRegions,
    canAccessData,
    
    // Simple flags for components - all true for open access
    canViewData: true,
    canEditData: isAdmin,
    canDeleteData: isAdmin,
    canExportData: true,
    
    // Legacy compatibility (for components not yet updated)
    hasRestrictedAccess: false,
    shouldShowAggregated: true,
    shouldShowIndividualData: true,
    canCompareWithOthers: true,
    canSeeBMUData: true,
    
    // Deprecated properties (kept for backwards compatibility during migration)
    isCiaUser: false,
    isWbciaUser: false,
    isIiaUser: false,
    userBMU: null,
    referenceBMU: null,
    referenceDistrict: null,
    userFisherId: null,
    getAccessibleBMUs: (allBMUs: string[]) => allBMUs,
    getLimitedBMUs: (allBMUs: string[]) => allBMUs,
  };
};

export default useUserPermissions; 