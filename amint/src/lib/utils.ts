import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add TypeScript declaration for Tauri's global variable
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

// Check if running in a Tauri environment
export const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};

// Safe wrapper for Tauri API calls
export async function invokeTauri(command: string, args?: Record<string, unknown>) {
  if (!isTauri()) {
    console.warn(`Tauri command ${command} called in web environment`);
    return null;
  }
  
  try {
    // Use any to bypass TypeScript checks since v2 types might be different
    const tauriInvoke = window.__TAURI__.invoke;
    if (typeof tauriInvoke === 'function') {
      return await tauriInvoke(command, args);
    } else {
      console.error('Tauri invoke function not found');
      return null;
    }
  } catch (error) {
    console.error(`Error invoking Tauri command ${command}:`, error);
    return null;
  }
}
