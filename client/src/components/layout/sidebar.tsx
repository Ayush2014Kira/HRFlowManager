import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Settings,
  UserCheck,
  DollarSign, 
  CheckCircle, 
  BarChart3,
  MapPin
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Employee Management", href: "/employees", icon: Users },
  { name: "Attendance & Punch", href: "/attendance", icon: Clock },
  { name: "Leave Applications", href: "/leaves", icon: Calendar },
  { name: "Leave Types", href: "/leave-types", icon: Settings },
  { name: "Leave Assignments", href: "/employee-leave-assignments", icon: UserCheck },
  { name: "Payroll & Salary", href: "/payroll", icon: DollarSign },
  { name: "Approvals", href: "/approvals", icon: CheckCircle },
  { name: "Field Tracking", href: "/field-tracking", icon: MapPin },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();
  
  const { data: pendingApprovals } = useQuery({
    queryKey: ["/api/approvals/pending"],
  });

  const pendingCount = Array.isArray(pendingApprovals) ? pendingApprovals.length : 0;

  return (
    <aside className="w-64 bg-white shadow-sm h-screen sticky top-0 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
              isActive
                ? "text-white bg-primary"
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
              {item.name === "Approvals" && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
