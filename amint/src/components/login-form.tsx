import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { useEffect, useRef, useState } from "react"
import { loginDev } from "@/lib/api"
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onLogin?: (userInfo?: { name: string; email: string; picture: string; user_id: string }) => void;
}

export function LoginForm({
  className,
  onLogin,
  ...props
}: LoginFormProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    console.log("LoginForm: useEffect running.");
    const gsiScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    const initGsi = () => {
      if (googleButtonRef.current && typeof window !== 'undefined' && window.google?.accounts?.id) {
        console.log("LoginForm: window.google.accounts.id found. Initializing...");
        try {
          google.accounts.id.initialize({
            client_id: '804234736108-9g315p31kckd1j8opgvsmnbq18p2r1ph.apps.googleusercontent.com',
            callback: handleGoogleResponse
          });
          google.accounts.id.renderButton(
            googleButtonRef.current,
            { type: 'standard', theme: 'outline', size: 'large' }
          );
          console.log("LoginForm: Google Sign-In initialized and button rendered.");
        } catch (error) {
          console.error("LoginForm: Error initializing/rendering Google Sign-In:", error);
        }
      } else {
        console.warn("LoginForm: initGsi called, but window.google.accounts.id not ready or button ref missing.");
      }
    };

    if (!gsiScript) {
      console.error("LoginForm: GSI script tag not found in DOM!");
      return; // Cannot proceed without the script tag
    }

    // Check if the script is already loaded and the google object is ready
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
       console.log("LoginForm: GSI already loaded.");
       initGsi();
    } else {
       console.log("LoginForm: GSI not loaded yet. Attaching onload listener.");
       // Define the function to be called on script load
       const handleScriptLoad = () => {
         console.log("LoginForm: GSI script onload event fired.");
         // Use a small timeout to ensure the google object is fully available after onload
         setTimeout(initGsi, 100); 
       };
       
       // Attach listeners
       gsiScript.addEventListener('load', handleScriptLoad);
       gsiScript.addEventListener('error', () => {
         console.error("LoginForm: Error loading GSI script!");
       });
       
       // Check again in case script loaded between querySelector and addEventListener
       if (typeof window !== 'undefined' && window.google?.accounts?.id) {
         console.log("LoginForm: GSI loaded between check and listener attachment.");
         // Clean up listener if we initialize immediately
         gsiScript.removeEventListener('load', handleScriptLoad);
         initGsi();
       }
       
       // Cleanup function to remove listeners when the component unmounts
       return () => {
         console.log("LoginForm: Cleaning up GSI script listeners.");
         gsiScript.removeEventListener('load', handleScriptLoad);
         gsiScript.removeEventListener('error', () => {
           console.error("LoginForm: Error loading GSI script!");
         });
       };
    }

    // No explicit cleanup needed if script was already loaded initially

  }, []); // Empty dependency array: run only once on mount

  const handleGoogleResponse = async (response: google.accounts.id.CredentialResponse) => {
    console.log("LoginForm: handleGoogleResponse triggered. Raw response:", response);
    
    try {
      // Decode the JWT to get user information
      const payload = parseJwt(response.credential);
      console.log("LoginForm: Parsed Payload:", payload);
      
      if (!payload || !payload.email) {
        throw new Error("Failed to parse JWT or missing email in payload");
      }
      
      // Create a unique ID for this Google user
      const googleUserId = `google_${payload.sub || payload.email.split('@')[0]}`;
      
      // Call the backend API to register/login the Google user
      const apiResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: googleUserId,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          picture: payload.picture || "",
          access_token: response.credential,
          refresh_token: null,
          token_expiry: null
        }),
      });
      
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Backend login failed: ${apiResponse.status} - ${errorText}`);
      }
      
      const userData = await apiResponse.json();
      console.log("LoginForm: Backend login successful:", userData);
      
      if (onLogin) {
        // Pass the backend-provided user_id along with other user details
        onLogin({
          name: payload.name || "Google User",
          email: payload.email,
          picture: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || payload.email)}&background=random`,
          user_id: userData.user_id // Use the user_id from the backend
        });
      }
    } catch (error) {
      console.error("LoginForm: Authentication error:", error);
      
      // Call onLogin with undefined to signal login failure
      if (onLogin) {
        onLogin(undefined);
      }
      
      // Show error toast
      const { toast } = useToast();
toast({
  title: "Login Failed",
  description: error instanceof Error ? error.message : "Authentication error occurred",
  variant: "destructive",
});
    }
  };

  // Function to parse JWT - basic implementation
  const parseJwt = (token: string): { name: string; email: string; picture: string; sub?: string } | null => {
    console.log("LoginForm: parseJwt called with token:", token ? token.substring(0, 20) + "..." : "undefined");
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.error("LoginForm: parseJwt - Invalid token format (missing payload).");
        return null;
      }
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const parsed = JSON.parse(jsonPayload);
      // Ensure standard OIDC claims are present
      if (parsed.name && parsed.email && parsed.picture) {
        return {
          name: parsed.name,
          email: parsed.email,
          picture: parsed.picture,
          sub: parsed.sub  // Add the subject ID
        };
      }
      console.warn("LoginForm: parseJwt - JWT payload missing standard claims (name, email, picture)", parsed);
      return null;
    } catch (e) {
      console.error("LoginForm: parseJwt - Error parsing Google JWT", e);
      return null;
    }
  };

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  // Handle development login
  const handleDevLogin = async () => {
    if (!onLogin) return;
    
    setIsLoggingIn(true);
    try {
      console.log("Development login button clicked");
      // Call the dev-login endpoint to create the user in the database
      const userData = await loginDev();
      
      // Pass the user information returned from the API
      onLogin({
        name: userData.name,
        email: userData.email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
        user_id: userData.user_id
      });
    } catch (error) {
      console.error("Development login failed:", error);
      // Call onLogin with undefined to signal login failure
      onLogin(undefined);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 items-center", className)} {...props}>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>
            Sign in using your Google account{isDevelopment ? " or bypass for testing" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 items-center">
            {/* Google Sign-In button container */}
            <div ref={googleButtonRef} className="w-full flex justify-center"></div>
          </div>
        </CardContent>
        {isDevelopment && (
          <CardFooter>
            {/* Bypass button for testing - only shown in development */}
            <Button
              variant="secondary"
              className="w-full mt-2"
              onClick={handleDevLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Logging in..." : "Test Login (Bypass)"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
