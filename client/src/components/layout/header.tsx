import { Bell, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Header() {
  const [, setLocation] = useLocation();
  const { data: pendingApprovals } = useQuery({
    queryKey: ["/api/approvals/pending"],
  });

  const pendingCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/login");
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <User className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">HRMS Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-5 w-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Button>
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Admin User</div>
                <div className="text-gray-500">HR Manager</div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
