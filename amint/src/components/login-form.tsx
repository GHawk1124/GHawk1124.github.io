import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
import { useEffect, useRef } from "react"

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onLogin?: (userInfo?: { name: string; email: string; picture: string }) => void;
}

export function LoginForm({
  className,
  onLogin,
  ...props
}: LoginFormProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);

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

  const handleGoogleResponse = (response: google.accounts.id.CredentialResponse) => {
    console.log("LoginForm: handleGoogleResponse triggered. Raw response:", response);
    // Decode the JWT to get user information
    const payload = parseJwt(response.credential);
    console.log("LoginForm: Parsed Payload:", payload);
    
    if (onLogin && payload) {
      // Pass the necessary info up
      onLogin({
        name: payload.name,      // Standard OIDC claim
        email: payload.email,    // Standard OIDC claim
        picture: payload.picture // Standard OIDC claim
      });
    } else if (onLogin) {
      console.error("Failed to parse JWT or onLogin not provided.");
      onLogin(undefined); // Indicate login failure or lack of info
    }
  };

  // Function to parse JWT - basic implementation
  const parseJwt = (token: string): { name: string; email: string; picture: string } | null => {
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
          picture: parsed.picture
        };
      }
      console.warn("LoginForm: parseJwt - JWT payload missing standard claims (name, email, picture)", parsed);
      return null;
    } catch (e) {
      console.error("LoginForm: parseJwt - Error parsing Google JWT", e);
      return null;
    }
  };

  // Comment out the form submit handler for now
  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (onLogin) {
  //     // For basic login, we don't have user info
  //     onLogin();
  //   }
  // };

  return (
    <div className={cn("flex flex-col gap-6 items-center", className)} {...props}>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Login</CardTitle>
          <CardDescription>
            Sign in using your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* <form onSubmit={handleSubmit}> // Comment out form submission */}
          {/* <div className="grid gap-6"> */}
            <div className="flex flex-col gap-4 items-center">
              {/* Apple login button commented out */}
              {/* <Button variant="outline" className="w-full" type="button" onClick={() => onLogin ? onLogin() : null}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" className="mr-2">
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                Login with Apple
              </Button> */}
              
              {/* Google Sign-In button container */}
              <div ref={googleButtonRef} className="w-full flex justify-center"></div>
            </div>
            
            {/* Separator and traditional login form - commented out */}
            {/* <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border mt-6 mb-4">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
            <div className="text-center text-sm mt-6">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div> */}
          {/* </div> // End commented grid */}
          {/* </form> // End commented form */}
        </CardContent>
      </Card>
      {/* Terms of service link - commented out */}
      {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div> */}
    </div>
  )
}
