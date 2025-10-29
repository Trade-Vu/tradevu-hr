import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3,
  UserCircle,
  LogOut,
  Menu,
  Briefcase,
  Video,
  ClipboardCheck,
  Calendar,
  DollarSign,
  UserPlus,
  Receipt,
  MessageSquare,
  Settings
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
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: createPageUrl("Employees"),
    icon: Users,
  },
  {
    title: "Attendance",
    url: createPageUrl("Attendance"),
    icon: Calendar,
  },
  {
    title: "Payroll",
    url: createPageUrl("Payroll"),
    icon: DollarSign,
  },
  {
    title: "Recruitment",
    url: createPageUrl("Recruitment"),
    icon: UserPlus,
  },
  {
    title: "Expenses",
    url: createPageUrl("Expenses"),
    icon: Receipt,
  },
  {
    title: "HR Letters",
    url: createPageUrl("HRLetters"),
    icon: FileText,
  },
  {
    title: "Surveys",
    url: createPageUrl("Surveys"),
    icon: MessageSquare,
  },
  {
    title: "Templates",
    url: createPageUrl("Templates"),
    icon: FileText,
  },
  {
    title: "Training LMS",
    url: createPageUrl("Training"),
    icon: Video,
  },
  {
    title: "Evaluations",
    url: createPageUrl("Evaluations"),
    icon: ClipboardCheck,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: BarChart3,
  },
];

const employeeNavigation = [
  {
    title: "My Dashboard",
    url: createPageUrl("EmployeePortal"),
    icon: Briefcase,
  },
  {
    title: "My Training",
    url: createPageUrl("Training"),
    icon: Video,
  },
  {
    title: "Request HR Letter",
    url: createPageUrl("HRLetters"),
    icon: FileText,
  },
  {
    title: "Expense Claims",
    url: createPageUrl("Expenses"),
    icon: Receipt,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isEmployee, setIsEmployee] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Check if user needs to set up organization
        if (!currentUser.organization_id && currentPageName !== 'OrganizationSetup') {
          navigate('/OrganizationSetup');
          return;
        }

        // Load organization
        if (currentUser.organization_id) {
          const orgs = await base44.entities.Organization.filter({ id: currentUser.organization_id });
          if (orgs.length > 0) {
            setOrganization(orgs[0]);
          }
        }
        
        const employees = await base44.entities.Employee.filter({ 
          email: currentUser.email,
          organization_id: currentUser.organization_id 
        });
        setIsEmployee(employees.length > 0);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, [currentPageName, navigate]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = isEmployee && user?.role !== 'admin' ? employeeNavigation : navigationItems;

  // If on organization setup page, don't show layout
  if (currentPageName === 'OrganizationSetup') {
    return children;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <Sidebar className="border-r border-slate-200 bg-white">
          <SidebarHeader className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              {organization?.logo_url ? (
                <img src={organization.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-900 text-lg leading-tight">EonHR</h2>
                <p className="text-xs text-slate-500 truncate">{organization?.name || 'HR Management'}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                {isEmployee && user?.role !== 'admin' ? 'Employee Menu' : 'Main Menu'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {(user?.role === 'admin' || user?.is_organization_owner) && (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === createPageUrl("Settings") ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        <Link to={createPageUrl("Settings")} className="flex items-center gap-3 px-3 py-2.5">
                          <Settings className="w-5 h-5" />
                          <span className="font-medium">Settings</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-slate-100">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <UserCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/Profile')}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                {(user?.role === 'admin' || user?.is_organization_owner) && (
                  <DropdownMenuItem onClick={() => navigate('/Settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div>
                <h1 className="text-base font-bold text-slate-900">EonHR</h1>
                <p className="text-xs text-slate-500">{organization?.name}</p>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}