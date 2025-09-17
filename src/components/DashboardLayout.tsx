import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import EmailVerificationModal from "@/components/EmailVerificationModal";

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user && !user.verified) {
      setShowVerificationModal(true);
    }
  }, [user, loading, navigate]);

  // Check email verification status
  const isEmailVerified = user?.verified ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-12 flex items-center border-b border-border bg-card px-4">
              <SidebarTrigger className="interactive-button" />
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-foreground">Meta CAPI Dashboard</h1>
              </div>
            </header>
            <main className="flex-1 p-6 overflow-auto">
              {isEmailVerified ? (
                <Outlet />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Please verify your email to access the dashboard...</p>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </SidebarProvider>
      
      <EmailVerificationModal 
        isOpen={showVerificationModal && !isEmailVerified} 
      />
    </>
  );
}