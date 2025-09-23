import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OptimizedCountryCodeSelect } from "@/components/ui/optimized-country-code-select";
import { Loader2, Eye, EyeOff, Clock } from "lucide-react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { LoginRateLimit } from "@/lib/rate-limit";
import { FlagIcon } from 'react-flag-kit';
import { COUNTRY_CODES, SYSTEM_CURRENCIES } from "@/utils/constants";
import { TIMEZONES } from "@/lib/timezone-utils";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const verificationToken = searchParams.get('token');
  
  // Check rate limit status on component mount and set up countdown timer
  useEffect(() => {
    const checkRateLimit = () => {
      const blocked = LoginRateLimit.isBlocked();
      setIsBlocked(blocked);
      
      if (blocked) {
        const time = LoginRateLimit.getFormattedRemainingTime();
        setRemainingTime(time);
      } else {
        setRemainingTime("");
        setRemainingAttempts(LoginRateLimit.getRemainingAttempts());
      }
    };

    // Check immediately
    checkRateLimit();

    // Set up interval to update countdown
    const interval = setInterval(checkRateLimit, 1000);

    return () => clearInterval(interval);
  }, []);

  // Clear errors when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError("");
    setSuccess("");
    // Reset loading state when switching tabs
    setIsLoading(false);
  };
  const { signIn, signUp, user, forgotPassword, resetPassword, verifyEmail } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated (but not during login process)
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, navigate, isLoading]);

  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });

  const [signUpForm, setSignUpForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: "+1",
    systemCurrency: "USD",
    timezone: "",
  });

  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: "",
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check if we're on reset password page with token or email verification
  useEffect(() => {
    if (location.pathname === '/verify-email' && verificationToken) {
      setShowEmailVerification(true);
      setShowResetPassword(false);
      setShowForgotPassword(false);
      // Auto-verify email when page loads
      handleEmailVerification();
    } else if (location.pathname === '/reset-password' && resetToken) {
      setShowResetPassword(true);
      setShowForgotPassword(false);
      setShowEmailVerification(false);
    } else if (location.pathname === '/reset-password') {
      setShowForgotPassword(true);
      setShowResetPassword(false);
      setShowEmailVerification(false);
    }
  }, [location.pathname, resetToken, verificationToken]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is blocked
    if (LoginRateLimit.isBlocked()) {
      const time = LoginRateLimit.getFormattedRemainingTime();
      setError(`Too many failed attempts. Please try again in ${time}.`);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await signIn(signInForm.email, signInForm.password);
      if (error) {
        // Record failed attempt
        LoginRateLimit.recordFailedAttempt();
        
        // Update UI state
        const blocked = LoginRateLimit.isBlocked();
        setIsBlocked(blocked);
        setRemainingAttempts(LoginRateLimit.getRemainingAttempts());
        
        if (blocked) {
          const time = LoginRateLimit.getFormattedRemainingTime();
          setError(`Too many failed attempts. Please try again in ${time}.`);
        } else {
          const attemptsLeft = LoginRateLimit.getRemainingAttempts();
          setError(`${error.message} (${attemptsLeft} attempts remaining)`);
        }
        
        setIsLoading(false);
      } else {
        // Record successful attempt (clears rate limit data)
        LoginRateLimit.recordSuccessfulAttempt();
        setIsBlocked(false);
        setRemainingAttempts(3);
        
        toast({
          title: "Success",
          description: "Welcome back! Redirecting to dashboard...",
        });
        // Don't manually navigate here - let the useEffect handle it when user state updates
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Record failed attempt for unexpected errors too
      LoginRateLimit.recordFailedAttempt();
      
      // Update UI state
      const blocked = LoginRateLimit.isBlocked();
      setIsBlocked(blocked);
      setRemainingAttempts(LoginRateLimit.getRemainingAttempts());
      
      if (blocked) {
        const time = LoginRateLimit.getFormattedRemainingTime();
        setError(`Too many failed attempts. Please try again in ${time}.`);
      } else {
        const attemptsLeft = LoginRateLimit.getRemainingAttempts();
        setError(`An unexpected error occurred. Please try again. (${attemptsLeft} attempts remaining)`);
      }
      
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!signUpForm.email.trim()) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }
    if (!emailRegex.test(signUpForm.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // First name validation
    if (!signUpForm.firstName.trim()) {
      setError("First name is required");
      setIsLoading(false);
      return;
    }
    if (signUpForm.firstName.trim().length < 2) {
      setError("First name must be at least 2 characters");
      setIsLoading(false);
      return;
    }

    // Last name validation
    if (!signUpForm.lastName.trim()) {
      setError("Last name is required");
      setIsLoading(false);
      return;
    }
    if (signUpForm.lastName.trim().length < 2) {
      setError("Last name must be at least 2 characters");
      setIsLoading(false);
      return;
    }

    // Password validation
    if (!signUpForm.password) {
      setError("Password is required");
      setIsLoading(false);
      return;
    }
    if (signUpForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    // Confirm password validation
    if (!signUpForm.confirmPassword) {
      setError("Please confirm your password");
      setIsLoading(false);
      return;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Country code validation
    if (!signUpForm.countryCode) {
      setError("Country code is required");
      setIsLoading(false);
      return;
    }
    // Validate that the selected country code exists in our constants
    const validCountryCode = COUNTRY_CODES.find(cc => cc.code === signUpForm.countryCode);
    if (!validCountryCode) {
      setError("Please select a valid country code");
      setIsLoading(false);
      return;
    }

    // Phone number validation
    if (!signUpForm.phone.trim()) {
      setError("Phone number is required");
      setIsLoading(false);
      return;
    }
    // Phone number should be numeric only and between 7-15 digits
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(signUpForm.phone.trim())) {
      setError("Please enter a valid phone number (7-15 digits)");
      setIsLoading(false);
      return;
    }

    // System currency validation
    if (!signUpForm.systemCurrency) {
      setError("Please select a system currency");
      setIsLoading(false);
      return;
    }
    // Validate that the selected currency exists in our constants
    const validCurrency = SYSTEM_CURRENCIES.find(c => c.code === signUpForm.systemCurrency);
    if (!validCurrency) {
      setError("Please select a valid system currency");
      setIsLoading(false);
      return;
    }

    // Timezone validation
    if (!signUpForm.timezone) {
      setError("Please select a timezone");
      setIsLoading(false);
      return;
    }
    // Validate that the selected timezone exists in our constants
    const validTimezone = TIMEZONES.find(tz => tz.value === signUpForm.timezone);
    if (!validTimezone) {
      setError("Please select a valid timezone");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(signUpForm.email, signUpForm.password, {
        first_name: signUpForm.firstName,
        last_name: signUpForm.lastName,
        phone: signUpForm.phone,
        country_code: signUpForm.countryCode,
        system_currency: signUpForm.systemCurrency,
        timezone: signUpForm.timezone,
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else {
          setError(error.message);
        }
      } else {
        // Clear the form
        setSignUpForm({
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
          phone: "",
          countryCode: "+1",
          systemCurrency: "USD",
          timezone: "",
        });
        
        // Show success message
        toast({
          title: "Account Created Successfully!",
          description: "You can now sign in with your credentials.",
        });
        
        // Pre-fill sign in email for convenience
        setSignInForm(prev => ({ ...prev, email: signUpForm.email }));
        
        // Switch to sign in tab
        setActiveTab("signin");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await forgotPassword(forgotPasswordForm.email);
      
      if (error) {
        setError(error.message);
      } else {
        // setSuccess("Password reset instructions have been sent to your email.");
        setForgotPasswordForm({ email: "" });
        
        toast({
          title: "Email Sent",
          description: "Check your email for password reset instructions.",
        });
      }
    } catch (err: any) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (resetPasswordForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (!resetToken) {
      setError("Invalid reset token");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await resetPassword(resetToken, resetPasswordForm.password, resetPasswordForm.confirmPassword);
      
      if (error) {
        setError(error.message);
      } else {
        // setSuccess("Password has been reset successfully! You can now sign in with your new password.");
        setResetPasswordForm({ password: "", confirmPassword: "" });
        
        toast({
          title: "Password Reset Successful",
          description: "You can now sign in with your new password.",
        });
        
        setTimeout(() => {
          navigate("/auth");
          setShowResetPassword(false);
          setShowForgotPassword(false);
        }, 2000);
      }
    } catch (err: any) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    if (!verificationToken) {
      setError("Invalid verification token");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await verifyEmail(verificationToken);
      
      if (error) {
        setError(error.message);
      } else {
        // setSuccess("Email verified successfully! You can now sign in to your account.");
        
        toast({
          title: "Email Verified",
          description: "Your email has been verified successfully!",
        });
        
        setTimeout(() => {
          navigate("/auth");
          setShowEmailVerification(false);
        }, 3000);
      }
    } catch (err: any) {
      setError("Failed to verify email. Please try again or contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 p-3 rounded-xl">
            <img src="/trackaff_logo_background_removed.png" alt="TrackAff" className="w-auto" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Meta CAPI Tracking Platform
            </h1>
            <p className="text-muted-foreground">
              Advanced conversion tracking and lead management
            </p>
          </div>
        </div>

        <Card className="slide-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              {showEmailVerification 
                ? "Verify Your Email" 
                : showResetPassword 
                ? "Set New Password" 
                : showForgotPassword 
                ? "Reset Your Password" 
                : "Access Your Dashboard"}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {showEmailVerification 
                ? "We're verifying your email address..." 
                : showResetPassword 
                ? "Create a new password for your account" 
                : showForgotPassword 
                ? "Enter your email to receive password reset instructions" 
                : "Sign in to your account or create a new one"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showEmailVerification ? (
              <div className="space-y-4">
                {error && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500 bg-green-50">
                    <AlertDescription className="text-green-700">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {isLoading && !success && !error && (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Verifying your email...</p>
                  </div>
                )}

                {!isLoading && !success && !error && (
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      Click the button below to verify your email address.
                    </p>
                    <Button
                      onClick={handleEmailVerification}
                      className="w-full interactive-button bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Verify Email
                    </Button>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/auth");
                      setShowEmailVerification(false);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : showResetPassword ? (
              <div className="space-y-4">
                {error && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500 bg-green-50">
                    <AlertDescription className="text-green-700">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="reset-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={resetPasswordForm.password}
                        onChange={(e) =>
                          setResetPasswordForm({ ...resetPasswordForm, password: e.target.value })
                        }
                        required
                        className="bg-input border-border focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="reset-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={resetPasswordForm.confirmPassword}
                        onChange={(e) =>
                          setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })
                        }
                        required
                        className="bg-input border-border focus:border-primary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full interactive-button bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/auth");
                        setShowResetPassword(false);
                        setShowForgotPassword(false);
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            ) : !showForgotPassword ? (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500 bg-green-50">
                    <AlertDescription className="text-green-700">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInForm.email}
                      onChange={(e) =>
                        setSignInForm({ ...signInForm, email: e.target.value })
                      }
                      required
                      disabled={isBlocked}
                      className="bg-input border-border focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInForm.password}
                        onChange={(e) =>
                          setSignInForm({ ...signInForm, password: e.target.value })
                        }
                        required
                        disabled={isBlocked}
                        className="bg-input border-border focus:border-primary pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isBlocked}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        disabled={isBlocked}
                        className="text-xs text-muted-foreground hover:text-primary underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full interactive-button bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading || isBlocked}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isBlocked ? `Try again in ${remainingTime}` : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">First Name</Label>
                      <Input
                        id="signup-firstname"
                        type="text"
                        placeholder="First name"
                        value={signUpForm.firstName}
                        onChange={(e) =>
                          setSignUpForm({ ...signUpForm, firstName: e.target.value })
                        }
                        required
                        className="bg-input border-border focus:border-secondary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Last Name</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Last name"
                        value={signUpForm.lastName}
                        onChange={(e) =>
                          setSignUpForm({ ...signUpForm, lastName: e.target.value })
                        }
                        required
                        className="bg-input border-border focus:border-secondary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpForm.email}
                      onChange={(e) =>
                        setSignUpForm({ ...signUpForm, email: e.target.value })
                      }
                      required
                      className="bg-input border-border focus:border-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpForm.password}
                        onChange={(e) =>
                          setSignUpForm({ ...signUpForm, password: e.target.value })
                        }
                        required
                        className="bg-input border-border focus:border-secondary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signUpForm.confirmPassword}
                        onChange={(e) =>
                          setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })
                        }
                        required
                        className="bg-input border-border focus:border-secondary pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Phone Number and Country Code */}
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                      <OptimizedCountryCodeSelect
                        value={signUpForm.countryCode}
                        onValueChange={(value) =>
                          setSignUpForm({ ...signUpForm, countryCode: value })
                        }
                        className="w-36"
                        placeholder="Select country code"
                      />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={signUpForm.phone}
                        onChange={(e) => {
                          // Only allow numeric input
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setSignUpForm({ ...signUpForm, phone: value });
                        }}
                        required
                        className="flex-1 bg-input border-border focus:border-secondary"
                      />
                    </div>
                  </div>

                  {/* System Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-currency">System Currency</Label>
                    <Select
                      value={signUpForm.systemCurrency}
                      onValueChange={(value) =>
                        setSignUpForm({ ...signUpForm, systemCurrency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {signUpForm.systemCurrency && (
                            <div className="flex items-center gap-2">
                              <FlagIcon 
                                code={SYSTEM_CURRENCIES.find(c => c.code === signUpForm.systemCurrency)?.flagCode as any} 
                                size={16} 
                              />
                              <span>{SYSTEM_CURRENCIES.find(c => c.code === signUpForm.systemCurrency)?.name}</span>
                              <span>({SYSTEM_CURRENCIES.find(c => c.code === signUpForm.systemCurrency)?.symbol})</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <FlagIcon code={currency.flagCode as any} size={16} />
                              <span className="font-medium">{currency.name}</span>
                              <span className="text-xs text-gray-500">({currency.symbol})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-timezone">Timezone</Label>
                    <Select
                      value={signUpForm.timezone}
                      onValueChange={(value) =>
                        setSignUpForm({ ...signUpForm, timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone">
                          {signUpForm.timezone && (
                            <span className="truncate">
                              {TIMEZONES.find(tz => tz.value === signUpForm.timezone)?.label}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {TIMEZONES.map((timezone) => (
                          <SelectItem key={timezone.value} value={timezone.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{timezone.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {timezone.offset.includes('/') 
                                  ? `GMT ${timezone.offset.split('/')[0]} / GMT ${timezone.offset.split('/')[1]}`
                                  : `GMT ${timezone.offset}`
                                }
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full interactive-button bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            ) : (
              <div className="space-y-4">
                {error && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertDescription className="text-destructive">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="border-green-500 bg-green-50">
                    <AlertDescription className="text-green-700">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotPasswordForm.email}
                      onChange={(e) =>
                        setForgotPasswordForm({ email: e.target.value })
                      }
                      required
                      className="bg-input border-border focus:border-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full interactive-button bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError("");
                        setSuccess("");
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure • GDPR Compliant • Enterprise Ready</p>
        </div>
      </div>
    </div>
  );
}