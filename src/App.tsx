import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Submissions from "./pages/Submissions";
import Connections from "./pages/Connections";
import OptInPages from "./pages/OptInPages";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PublicOptIn from "./pages/PublicOptIn";
import { AuthProvider } from "./hooks/useAuth";
import { TimezoneProvider } from "./hooks/useTimezone";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TimezoneProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public Routes (No Authentication Required) */}
            <Route path="/optin/:connectionId" element={<PublicOptIn />} />
            <Route path="/optin" element={<PublicOptIn />} />
            
            {/* Main App Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<Auth />} />
            <Route path="/verify-email" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="connections" element={<Connections />} />
              <Route path="opt-in" element={<OptInPages />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/submissions" element={<DashboardLayout />}>
              <Route index element={<Submissions />} />
            </Route>
            <Route path="/connections" element={<DashboardLayout />}>
              <Route index element={<Connections />} />
            </Route>
            <Route path="/opt-in" element={<DashboardLayout />}>
              <Route index element={<OptInPages />} />
            </Route>
            <Route path="/settings" element={<DashboardLayout />}>
              <Route index element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </TimezoneProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
