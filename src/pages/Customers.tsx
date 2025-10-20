import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  User, 
  Mail, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Customer {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  account_id: string;
  created_at: string;
  last_login?: string;
  verified: boolean;
  admin?: string;
  block_login?: boolean;
}

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    total_count: number;
  };
}

export default function Customers() {
  const { user, loginAsCustomer, isCustomerLoggedIn, getLoggedInCustomerInfo } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [updatingCustomerId, setUpdatingCustomerId] = useState<string | null>(null);
  const [blockingCustomerId, setBlockingCustomerId] = useState<string | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  // Search debounce
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user?.admin) {
      fetchCustomers();
    }
  }, [user, currentPage, perPage]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchCustomers();
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await apiClient.getCustomers(params);
      const data: CustomersResponse = response.data;
      
      const nonAdminCustomers = data.customers.filter(customer => customer.admin !== 'true');
      setCustomers(nonAdminCustomers);

      setTotalPages(data.pagination.total_pages);
      setTotalCustomers(data.customers.length);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          "Failed to fetch customers";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Set empty state on error
      setCustomers([]);
      setTotalPages(1);
      setTotalCustomers(0);
    } finally {
      setLoading(false);
    }
  };

  // Since search is now handled by the API, we only need to filter by verified status on the client side
  const filteredCustomers = customers.filter(customer => {
    const matchesVerified = verifiedFilter === "all" || 
      (verifiedFilter === "verified" && customer.verified) ||
      (verifiedFilter === "unverified" && !customer.verified);
    return matchesVerified;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage: string) => {
    setPerPage(parseInt(newPerPage));
    setCurrentPage(1); // Reset to first page when changing per page
  };

  const getVerifiedBadge = (verified: boolean) => {
    if (verified) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Unverified</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleLoginAsCustomer = async (customer: Customer) => {
    try {
      // Get customer session data
      const result = await loginAsCustomer(customer._id);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Type assertion since we know data exists if no error
      console.log('API Response data:', (result as { data: any; error: null }).data);
      const { access_token, customer: customerUser } = (result as { data: any; error: null }).data;
      console.log('Extracted customerUser:', customerUser);
      
      // Store customer session data temporarily for new tab
      const tempSessionData = {
        access_token,
        user: customerUser, // customerUser is already the customer object from API
        timestamp: Date.now()
      };
      
      // Store in sessionStorage (cleared when tab closes) with unique key
      const sessionKey = `temp_customer_session_${Date.now()}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(tempSessionData));
      
      console.log('Stored temp session data:', {
        sessionKey,
        customerEmail: customerUser.email,
        hasToken: !!access_token
      });
      
      // Open new tab with session key
      window.open(`/dashboard?temp_session=${sessionKey}`, "_blank");
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Failed to login as customer";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleUpdateVerificationStatus = async (customerId: string) => {
    try {
      setUpdatingCustomerId(customerId);
      
      await apiClient.updateVerificationStatus(customerId);
      
      // Update the customer's verification status in the local state
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer._id === customerId 
            ? { ...customer, verified: true }
            : customer
        )
      );
      
      toast({
        title: "Success",
        description: "Customer verification status updated successfully",
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('Error updating verification status:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          "Failed to update verification status";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUpdatingCustomerId(null);
    }
  };

  const handleBlockUnblockCustomer = async (customerId: string) => {
    try {
      setBlockingCustomerId(customerId);
      
      const response = await apiClient.blockUnblockCustomer(customerId);
      const { customer } = response.data;
      
      // Update the customer's block status in the local state
      setCustomers(prevCustomers => 
        prevCustomers.map(customerItem => 
          customerItem._id === customerId 
            ? { ...customerItem, block_login: customer.block_login }
            : customerItem
        )
      );
      
      const action = customer.block_login ? "blocked" : "unblocked";
      toast({
        title: "Success",
        description: `Customer has been ${action} successfully`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error('Error blocking/unblocking customer:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          "Failed to update customer access";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setBlockingCustomerId(null);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      setDeletingCustomerId(customerId);
      
      const response = await apiClient.deleteCustomer(customerId);
      const { message, deleted } = response.data;
      
      // Remove the customer from the local state
      setCustomers(prevCustomers => 
        prevCustomers.filter(customer => customer._id !== customerId)
      );
      
      toast({
        title: "Customer Deleted",
        description: `Successfully deleted customer. Removed ${deleted.user} user, ${deleted.opt_in_settings} opt-in settings, ${deleted.connections} connections, and ${deleted.submissions} submissions.`,
        variant: "default"
      });
      
      // Refresh the customers list to update counts
      fetchCustomers();
      
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          "Failed to delete customer";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeletingCustomerId(null);
    }
  };

  // Redirect non-admin users
  if (!user?.admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. Admin privileges required.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage and view all customer accounts
          </p>
        </div>
        {/* <Button className="interactive-button">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button> */}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Across all pages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Customers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.verified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCustomers > 0 ? Math.round((customers.filter(c => c.verified).length / totalCustomers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unverified Customers</CardTitle>
            <Users className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => !c.verified).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCustomers > 0 ? Math.round((customers.filter(c => !c.verified).length / totalCustomers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => {
                const createdDate = new Date(c.created_at);
                const now = new Date();
                const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                return createdDate >= thisMonth;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Registered this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>
            Search and filter through all customer accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={perPage.toString()} onValueChange={handlePerPageChange}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading customers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {customers.length === 0 ? "No customers found" : "No customers match your verification filter"}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {customer.account_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVerifiedBadge(customer.verified)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={!customer.block_login}
                            onCheckedChange={() => handleBlockUnblockCustomer(customer._id)}
                            disabled={blockingCustomerId === customer._id}
                            className="data-[state=checked]:bg-green-600"
                          />
                          <span className="text-sm text-muted-foreground">
                            {customer.block_login ? "Blocked" : "Active"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(customer.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowCustomerDialog(true);
                            }}
                            className="interactive-button"
                          >
                            <User className="h-3 w-3 mr-1" />
                            View Details
                          </Button> */}
                          {!customer.verified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateVerificationStatus(customer._id)}
                              disabled={updatingCustomerId === customer._id}
                              className="interactive-button"
                            >
                              {updatingCustomerId === customer._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3 mr-1" />
                                  Update Status
                                </>
                              )}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingCustomerId === customer._id}
                                className="interactive-button text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {deletingCustomerId === customer._id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-destructive mr-1"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. Deleting this customer will permanently remove:
                                  <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>The user account</li>
                                    <li>All opt-in settings</li>
                                    <li>All connections</li>
                                    <li>All submissions</li>
                                  </ul>
                                  <p className="mt-2 font-semibold">
                                    Customer: {customer.first_name} {customer.last_name} ({customer.email})
                                  </p>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCustomer(customer._id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Customer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleLoginAsCustomer(customer)}
                                    disabled={isCustomerLoggedIn}
                                    className="interactive-button bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    View As
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {isCustomerLoggedIn && (
                                <TooltipContent>
                                  <p>1 customer is already logged in. You need to logout that customer first.</p>
                                  {getLoggedInCustomerInfo() && (
                                    <p className="text-xs mt-1 text-muted-foreground">
                                      Currently logged in: {getLoggedInCustomerInfo()?.name}
                                    </p>
                                  )}
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={selectedCustomer.first_name} readOnly />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={selectedCustomer.last_name} readOnly />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={selectedCustomer.email} readOnly />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={selectedCustomer.phone || ''} readOnly />
              </div>
              <div>
                <Label>Account ID</Label>
                <Input value={selectedCustomer.account_id} readOnly className="font-mono" />
              </div>
              <div>
                <Label>Verification Status</Label>
                <div className="mt-2">
                  {getVerifiedBadge(selectedCustomer.verified)}
                </div>
              </div>
              <div>
                <Label>Joined Date</Label>
                <Input value={formatDate(selectedCustomer.created_at)} readOnly />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
