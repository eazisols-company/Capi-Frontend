import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmailVerificationModalProps {
  isOpen: boolean;
}

export default function EmailVerificationModal({ isOpen }: EmailVerificationModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user, signOut, resendVerificationEmail } = useAuth();

  if (!isOpen) return null;

  const handleResendVerification = async () => {
    if (!user?.email) {
      setError("User email not found");
      return;
    }

    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await resendVerificationEmail(user.email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Verification email has been sent! Please check your inbox.");
        
        toast({
          title: "Email Sent",
          description: "Please check your email for verification instructions.",
        });
      }
    } catch (err: any) {
      setError("Failed to resend verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // User will be redirected to auth page automatically by the auth system
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop clicks from bubbling
      >
        <Card className="border-orange-200 bg-white">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Email Verification Required
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Please verify your email address to access your dashboard
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  We sent a verification email to:
                </p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>Click the verification link in your email to activate your account.</p>
                <p>Can't find the email? Check your spam folder.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isResending ? "Sending..." : "Resend Verification Email"}
              </Button>

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Sign Out
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact our support team
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
