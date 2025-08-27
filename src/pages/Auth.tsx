import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

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
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error } = await signIn(signInForm.email, signInForm.password);
      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Success",
          description: "Welcome back! Redirecting to dashboard...",
        });
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (signUpForm.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(signUpForm.email, signUpForm.password, {
        first_name: signUpForm.firstName,
        last_name: signUpForm.lastName,
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else {
          setError(error.message);
        }
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-8 w-8 text-primary animate-glow" />
            <span className="text-2xl font-bold text-primary">TrackiTerra</span>
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

        <Card className="gradient-border slide-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              Access Your Dashboard
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
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
                      className="bg-input border-border focus:border-primary"
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
                  <Button
                    type="submit"
                    className="w-full interactive-button bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
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
                    <Input
                      id="signup-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) =>
                        setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })
                      }
                      required
                      className="bg-input border-border focus:border-secondary"
                    />
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
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure • GDPR Compliant • Enterprise Ready</p>
        </div>
      </div>
    </div>
  );
}