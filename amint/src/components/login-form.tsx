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
import { useState } from "react"
import { loginDev } from "@/lib/api"
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  onGoogleLogin?: () => void;
}

export function LoginForm({
  className,
  onGoogleLogin,
  ...props
}: LoginFormProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  // Handle login with Google
  const handleGoogleLogin = () => {
    if (onGoogleLogin) {
      onGoogleLogin();
    }
  };

  // Handle development login
  const handleDevLogin = async () => {
    setIsLoggingIn(true);
    try {
      console.log("Development login button clicked");
      // Call the dev-login endpoint to create the user in the database
      await loginDev();
      // The session will be set by the backend, so we don't need to do anything here
      // Reload the page to trigger the session check in App.tsx
      window.location.reload();
    } catch (error) {
      console.error("Development login failed:", error);
      toast({
        title: "Development login failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

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
            {/* Google Sign-In button */}
            <Button 
              className="w-full" 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
            >
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                className="h-5 w-5 mr-2"
              />
              Sign in with Google
            </Button>
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