import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to safely clear session data
export function clearSessionData() {
  try {
    // Clear localStorage items that might be related to auth
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.expires_at');
    localStorage.removeItem('supabase.auth.refresh_token');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any cookies that might be set
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  } catch (error) {
    console.error('Error clearing session data:', error);
  }
}

// Define session type
interface Session {
  user?: {
    id: string;
    email?: string;
  };
  access_token?: string;
}

// Utility function to check if user is authenticated
export function isAuthenticated(session: Session | null): boolean {
  return !!(session?.user && session?.access_token);
}

// Utility function to debounce function calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 