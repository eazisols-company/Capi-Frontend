import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Database,
  Link,
  Settings,
  FileText,
  LogOut,
  User,
  Users,
  ArrowLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const getMenuItems = (isAdmin: boolean) => {
  const baseItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
    { title: "Submissions", url: "/submissions", icon: Database },
    { title: "Connections", url: "/connections", icon: Link },
    { title: "Opt-in Pages", url: "/opt-in", icon: FileText },
  ];

  // Add Customers menu item only for admin users
  if (isAdmin) {
    baseItems.push({ title: "Customers", url: "/customers", icon: Users });
  }

  baseItems.push({ title: "Settings", url: "/settings", icon: Settings });
  
  return baseItems;
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user, switchBackToAdminFromCustomer } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  // Check if we're in a customer session
  const isCustomerSession = sessionStorage.getItem('is_customer_session') === 'true';
  
  // Get menu items based on admin status
  const menuItems = getMenuItems(user?.admin || false);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-lg" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGoToAdmin = async () => {
    await switchBackToAdminFromCustomer();
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300 border-r border-border bg-sidebar-background`}
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/trackaff_logo_background_removed.png" alt="TrackAff" className="h-8 w-auto" />
            <div className="flex flex-col">
              {/* <span className="text-xs text-muted-foreground">Meta CAPI Platform</span> */}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <img src="/favicon.svg" alt="TrackAff" className="h-6 w-auto" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    end 
                    className={({ isActive }) => `${getNavCls({ isActive })} interactive-button`}
                  >
                    <SidebarMenuButton isActive={isActive(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && user && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.admin ? 'Admin Account' : 'Customer Account'}
                </p>
              </div>
            </div>
            {isCustomerSession ? (
              <Button
                onClick={handleGoToAdmin}
                variant="outline"
                size="sm"
                className="w-full interactive-button border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Admin
              </Button>
            ) : (
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full interactive-button border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </div>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            {isCustomerSession ? (
              <Button
                onClick={handleGoToAdmin}
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                title="Go to Admin"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}