import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import Attendance from "@/pages/attendance";
import Leaves from "@/pages/leaves";
import Payroll from "@/pages/payroll";
import Approvals from "@/pages/approvals";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import EmployeePortalPage from "@/pages/employee-portal";
import FieldTrackingPage from "@/pages/field-tracking";
import ReportsPage from "@/pages/reports";
import AddEmployee from "@/pages/add-employee";
import EmployeeView from "@/pages/employee-view";
import EmployeeEdit from "@/pages/employee-edit";
import LeaveTypes from "@/pages/leave-types";
import EmployeeLeaveAssignments from "@/pages/employee-leave-assignments";
import TimeTracking from "@/pages/time-tracking";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

function Router() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check backend session instead of localStorage
    fetch("/api/auth/user", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(userData => {
        setUser(userData);
        setIsLoading(false);
      })
      .catch(() => {
        setUser(null);
        setIsLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST", 
        credentials: "include" 
      });
      setUser(null);
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setUser(null);
      setLocation("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route>
          {() => {
            setLocation("/login");
            return <LoginPage />;
          }}
        </Route>
      </Switch>
    );
  }

  // Show employee portal for employee role
  if (user.role === "employee") {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-full px-6 py-4 flex justify-between items-center">
              <h1 className="text-xl font-semibold">HRMS Employee Portal</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user.username}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          <main className="flex-1 overflow-y-auto p-6">
            <EmployeePortalPage />
          </main>
        </div>
      </div>
    );
  }

  // Show full admin/HR interface for admin and hr roles
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/employees" component={Employees} />
            <Route path="/add-employee" component={AddEmployee} />
            <Route path="/employees/:id/view" component={EmployeeView} />
            <Route path="/employees/:id/edit" component={EmployeeEdit} />
            <Route path="/attendance" component={Attendance} />
            <Route path="/leaves" component={Leaves} />
            <Route path="/leave-types" component={LeaveTypes} />
            <Route path="/employee-leave-assignments" component={EmployeeLeaveAssignments} />
            <Route path="/time-tracking" component={TimeTracking} />
            <Route path="/payroll" component={Payroll} />
            <Route path="/approvals" component={Approvals} />
            <Route path="/field-tracking" component={FieldTrackingPage} />
            <Route path="/reports" component={ReportsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
