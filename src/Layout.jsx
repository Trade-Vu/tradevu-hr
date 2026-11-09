// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/constants/pageRoutes";
import { 
  LayoutDashboard, Users, FileText, BarChart3, UserCircle, LogOut,
  Briefcase, Video, ClipboardCheck, Calendar, DollarSign, UserPlus, Receipt,
  MessageSquare, Settings, CheckSquare, Plane, MessageCircle, Home,
  Target, ShieldCheck, Laptop, CheckCircle, TrendingUp, BookOpen, Clock, CalendarRange,
  BookTemplate, ChevronRight, ChevronsUpDown, User
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/lib/AuthContext";
import { isFeatureEnabled } from '@/lib/featureFlags';
import { organizationsApi, approvalsApi } from "@/api";
import { isAdmin, isSuperAdmin, isHrAdmin, hasAdminPrivileges, isManager } from "@/lib/roleUtils";
import { usePendingApprovalsStream } from "@/hooks/usePendingApprovalsStream";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationStructure = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    isParent: true,
    children: [
      { title: "Overview", url: PAGE_ROUTES.HOME, icon: LayoutDashboard },
      { title: "Approvals", url: PAGE_ROUTES.PENDING_APPROVALS, icon: CheckCircle },
      import.meta.env.DEV && { title: "Assets", url: PAGE_ROUTES.ASSETS, icon: Laptop },
      { title: "Tasks & Projects", url: PAGE_ROUTES.TASK_MANAGER, icon: CheckSquare },
    ].filter(Boolean)
  },
  {
    title: "Employees",
    icon: Users,
    isParent: true,
    children: [
      { title: "All Employees", url: PAGE_ROUTES.EMPLOYEES, icon: Users },
      { title: "Leave Management", url: PAGE_ROUTES.LEAVE_MANAGEMENT, icon: Plane },
      { title: "HR Letter Requests", url: PAGE_ROUTES.HR_LETTERS, icon: FileText },
      import.meta.env.DEV && { title: "Attendance", url: PAGE_ROUTES.ATTENDANCE, icon: Calendar },
    ].filter(Boolean)
  },
  {
    title: "Payroll",
    icon: DollarSign,
    isParent: true,
    children: [
      { title: "Payroll", url: PAGE_ROUTES.PAYROLL, icon: DollarSign },
      { title: "Compensation", url: PAGE_ROUTES.COMPENSATION, icon: DollarSign },
      { title: "Adjustments", url: PAGE_ROUTES.PAYROLL_ADJUSTMENTS, icon: DollarSign },
      { title: "Reports", url: PAGE_ROUTES.PAYROLL_REPORTS, icon: TrendingUp },
      { title: "Statutory", url: PAGE_ROUTES.SETTINGS_STATUTORY, icon: Settings },
      { title: "Loans", url: PAGE_ROUTES.LOANS, icon: DollarSign },
      { title: "Expenses", url: PAGE_ROUTES.EXPENSES, icon: Receipt },
    ]
  },
].filter(Boolean);

const employeeNavigation = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    isParent: true,
    children: [
      { title: "Overview", url: PAGE_ROUTES.EMPLOYEE_SELF_SERVICE, icon: LayoutDashboard },
      { title: "My Profile", url: `${PAGE_ROUTES.EMPLOYEE_SELF_SERVICE}?tab=profile`, icon: User },
      { title: "My Tasks", url: PAGE_ROUTES.TASK_MANAGER, icon: CheckSquare },
    ].filter(Boolean)
  },
  {
    title: "HR & Finance",
    icon: FileText,
    isParent: true,
    children: [
      { title: "Leave Management", url: PAGE_ROUTES.LEAVE_MANAGEMENT, icon: Plane },
      { title: "My Loans", url: PAGE_ROUTES.LOANS, icon: DollarSign },
      { title: "Expense Claims", url: PAGE_ROUTES.EXPENSES, icon: Receipt },
    ]
  },
].filter(Boolean);

/**
 * Interactive Sub-Link with cursor-tracking spotlight animation matching dashboard cards
 * and dark navy blue background for the selected item.
 */
function SidebarSubLink({ to, title, icon: Icon, badge, isActive }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Link
      to={to}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative w-full h-8 px-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-between overflow-hidden outline-none",
        isActive
          ? "bg-[#0f172a] text-white shadow-xs font-semibold"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      )}
    >
      {/* Dashboard Card Spotlight Hover Effect */}
      {isActive && hovered && (
        <span
          className="pointer-events-none absolute -inset-px rounded-lg opacity-100 transition-opacity duration-200 z-0"
          style={{
            background: `radial-gradient(90px circle at ${pos.x}px ${pos.y}px, rgba(99, 102, 241, 0.45), transparent 80%)`,
          }}
        />
      )}
      {!isActive && hovered && (
        <span
          className="pointer-events-none absolute -inset-px rounded-lg opacity-100 transition-opacity duration-200 z-0"
          style={{
            background: `radial-gradient(90px circle at ${pos.x}px ${pos.y}px, rgba(79, 70, 229, 0.08), transparent 80%)`,
          }}
        />
      )}

      <span className="flex items-center gap-2 truncate relative z-10">
        <Icon
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-colors",
            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
          )}
        />
        <span className="truncate">{title}</span>
      </span>

      {badge && (
        <span
          className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px] font-bold ml-1 relative z-10",
            isActive
              ? "bg-rose-500 text-white"
              : "bg-rose-50 text-rose-700 border border-rose-200/60"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

/**
 * Collapsed Icon Button with cursor-tracking spotlight and dark navy selected state
 */
const CollapsedMenuButton = React.forwardRef(({ item, hasActiveChild, tooltip, ...props }, ref) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <SidebarMenuButton
      ref={ref}
      tooltip={tooltip}
      isActive={hasActiveChild}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-all duration-200 outline-none overflow-hidden",
        hasActiveChild
          ? "!bg-[#0f172a] !text-white shadow-sm font-semibold data-[active=true]:!bg-[#0f172a] data-[active=true]:!text-white"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
      )}
      {...props}
    >
      {/* Dashboard Card Spotlight Hover Effect */}
      {hasActiveChild && hovered && (
        <span
          className="pointer-events-none absolute -inset-px rounded-xl opacity-100 transition-opacity duration-200 z-0"
          style={{
            background: `radial-gradient(70px circle at ${pos.x}px ${pos.y}px, rgba(99, 102, 241, 0.45), transparent 80%)`,
          }}
        />
      )}
      {!hasActiveChild && hovered && (
        <span
          className="pointer-events-none absolute -inset-px rounded-xl opacity-100 transition-opacity duration-200 z-0"
          style={{
            background: `radial-gradient(70px circle at ${pos.x}px ${pos.y}px, rgba(79, 70, 229, 0.12), transparent 80%)`,
          }}
        />
      )}

      <Icon
        className={cn(
          "w-5 h-5 shrink-0 relative z-10 transition-colors",
          hasActiveChild ? "!text-white" : "text-slate-600"
        )}
      />

      {item.badge && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-xs z-20">
          {item.badge}
        </span>
      )}
    </SidebarMenuButton>
  );
});
CollapsedMenuButton.displayName = "CollapsedMenuButton";

function LayoutInner({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, viewMode, changeViewMode } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await logout();
      navigate(PAGE_ROUTES.LOGIN);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const userIsAdmin = isAdmin(user);
  const userIsSuperAdmin = isSuperAdmin(user);
  const userIsHrAdmin = isHrAdmin(user);
  const userHasPrivileges = hasAdminPrivileges(user);
  const userIsManager = isManager(user);
  const canSwitchViews = userIsHrAdmin && !userIsSuperAdmin;
  const canSeeAdminViews = userIsSuperAdmin || (userIsAdmin && (viewMode === 'ADMIN' || !viewMode));

  const pendingCountsStreamEnabled = !!user?.organizationId && userHasPrivileges;
  const { data: pendingData } = useQuery({
    queryKey: ['pendingApprovalsCount'],
    queryFn: () => approvalsApi.getPendingCounts(),
    enabled: pendingCountsStreamEnabled,
    refetchInterval: 60000,
  });
  usePendingApprovalsStream(pendingCountsStreamEnabled);

  const totalApprovalsCount = pendingData?.totalApprovalsCount || 0;
  const pendingOffboardingCount = pendingData?.pendingOffboardingCount || 0;
  const pendingLeaveCount = pendingData?.pendingLeaveCount || 0;
  const pendingProfilesCount = pendingData?.pendingProfilesCount || 0;

  // Build base navigation items according to role
  const baseNavItems = useMemo(() => {
    let items = canSeeAdminViews ? [...navigationStructure] : [...employeeNavigation];
    if (canSeeAdminViews) {
      items.push({
        title: "Settings",
        icon: Settings,
        isParent: true,
        children: [
          { title: "General Settings", url: PAGE_ROUTES.SETTINGS, icon: Settings },
          { title: "Approval Workflows", url: PAGE_ROUTES.SETTINGS_APPROVAL_WORKFLOWS, icon: CheckCircle },
          { title: "Work Shifts", url: PAGE_ROUTES.SETTINGS_SHIFTS, icon: Clock },
          { title: "Departments", url: PAGE_ROUTES.SETTINGS_DEPARTMENTS, icon: Users },
          { title: "Templates", url: PAGE_ROUTES.TEMPLATES, icon: BookTemplate },
          { title: "Employment", url: PAGE_ROUTES.SETTINGS_CLASSES, icon: Settings },
          { title: "Leave Types", url: PAGE_ROUTES.SETTINGS_LEAVE_TYPES, icon: CalendarRange },
          { title: "Public Holidays", url: PAGE_ROUTES.SETTINGS_PUBLIC_HOLIDAYS, icon: Calendar },
          { title: "Audit Logs", url: PAGE_ROUTES.AUDIT_LOGS, icon: ShieldCheck }
        ]
      });
    }
    return items;
  }, [canSeeAdminViews]);

  // Enrich items with live count badges
  const navItems = useMemo(() => {
    return baseNavItems.map(item => {
      if (item.title === "Dashboard" || item.title === "Home") {
        const pendingCount = canSeeAdminViews ? totalApprovalsCount : 0;
        return {
          ...item,
          badge: pendingCount > 0 ? pendingCount : undefined,
          children: item.children.map(child => {
            if (child.title === "Approvals") {
              return { ...child, badge: pendingCount > 0 ? pendingCount : undefined };
            }
            return child;
          })
        };
      }
      if (item.title === "Recruitment") {
        return {
          ...item,
          badge: pendingOffboardingCount > 0 ? pendingOffboardingCount : undefined,
          children: item.children.map(child => {
            if (child.title === "Offboarding") {
              return { ...child, badge: pendingOffboardingCount > 0 ? pendingOffboardingCount : undefined };
            }
            return child;
          })
        };
      }
      if (item.title === "Employees") {
        const empBadgeCount = pendingLeaveCount + pendingProfilesCount;
        return {
          ...item,
          badge: empBadgeCount > 0 ? empBadgeCount : undefined,
          children: item.children.map(child => {
            if (child.title === "Leave Management" && pendingLeaveCount > 0) {
              return { ...child, badge: pendingLeaveCount };
            }
            return child;
          })
        };
      }
      if (item.title === "HR & Finance") {
        const hrBadgeCount = userIsManager ? pendingLeaveCount : 0;
        return {
          ...item,
          badge: hrBadgeCount > 0 ? hrBadgeCount : undefined,
          children: item.children.map(child => {
            if (child.title === "Leave Management" && hrBadgeCount > 0) {
              return { ...child, badge: hrBadgeCount };
            }
            return child;
          })
        };
      }
      return item;
    });
  }, [baseNavItems, canSeeAdminViews, totalApprovalsCount, pendingOffboardingCount, pendingLeaveCount, pendingProfilesCount, userIsManager]);

  const pathname = location.pathname.toLowerCase();

  const isRouteActive = (targetUrl) => {
    if (!targetUrl) return false;
    const currentPath = location.pathname.toLowerCase();
    const currentSearch = location.search.toLowerCase();
    const currentFull = currentPath + currentSearch;
    const targetLower = targetUrl.toLowerCase();

    if (targetLower.includes('?')) {
      return currentFull === targetLower;
    }

    if (targetLower === PAGE_ROUTES.EMPLOYEE_SELF_SERVICE.toLowerCase()) {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      return currentPath === targetLower && (!tab || tab === 'overview');
    }

    return currentPath === targetLower;
  };

  // Keep track of which accordion group is open
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    navItems.forEach(item => {
      const hasActiveChild = item.children?.some(child => isRouteActive(child.url));
      if (hasActiveChild) initial[item.title] = true;
    });
    if (Object.keys(initial).length === 0 && navItems[0]) {
      initial[navItems[0].title] = true;
    }
    return initial;
  });

  // Auto-expand accordion when URL matches a child
  useEffect(() => {
    navItems.forEach(item => {
      const hasActiveChild = item.children?.some(child => isRouteActive(child.url));
      if (hasActiveChild) {
        setOpenGroups(prev => ({ ...prev, [item.title]: true }));
      }
    });
  }, [pathname, location.search, navItems]);

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Find active parent and sub-item for breadcrumb
  const currentSubItem = useMemo(() => {
    return navItems
      .flatMap(item => item.children || [])
      .find(child => isRouteActive(child.url));
  }, [navItems, pathname, location.search]);

  const currentParentItem = useMemo(() => {
    return navItems.find(item =>
      item.children?.some(child => isRouteActive(child.url))
    );
  }, [navItems, pathname, location.search]);

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-slate-50 text-slate-900">
      <Sidebar
        collapsible="icon"
        className="border-r border-slate-200/70 bg-white transition-all duration-200 z-30 select-none"
      >
        {/* 1. Brand Logo Header - Exactly h-14 (56px) and vertically centered */}
        <SidebarHeader className="h-14 p-0 px-4 border-b border-slate-200/70 bg-white flex flex-row items-center box-border shrink-0">
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full h-full">
              <Link to={PAGE_ROUTES.HOME} className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white shadow-xs hover:scale-105 transition-transform">
                <img
                  src="/logo-icon.png"
                  alt="Tradevu"
                  className="object-contain w-5 h-5 invert brightness-0"
                />
              </Link>
            </div>
          ) : (
            <div className="flex items-center w-full h-full gap-3">
              <Link to={PAGE_ROUTES.HOME} className="flex items-center gap-2.5 min-w-0 group focus:outline-none">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900 text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <img
                    src="/logo-icon.png"
                    alt="Tradevu Logo"
                    className="object-contain w-5 h-5 invert brightness-0"
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <span className="font-heading font-bold text-base tracking-tight truncate text-slate-900 leading-none">
                    Tradevu
                  </span>
                  <span className="text-[10px] text-slate-400 truncate uppercase font-semibold tracking-wider mt-1 leading-none">
                    {canSeeAdminViews ? 'HR Workspace' : 'Employee Portal'}
                  </span>
                </div>
              </Link>
            </div>
          )}
        </SidebarHeader>

        {/* 2. Navigation Content */}
        <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0 py-3 overflow-y-auto custom-scrollbar bg-white">
          <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasActiveChild = item.children?.some(c => isRouteActive(c.url));
              const isOpen = Boolean(openGroups[item.title]);

              // When collapsed in icon mode, render as centered button with spotlight effect
              if (isCollapsed) {
                return (
                  <SidebarMenuItem key={item.title} className="w-full flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <CollapsedMenuButton
                          item={item}
                          hasActiveChild={hasActiveChild}
                          tooltip={item.title}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        sideOffset={14}
                        className="w-56 p-1.5 shadow-xl border border-slate-200/80 bg-white rounded-2xl z-50 font-sans"
                      >
                        <div className="px-3 py-2 text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        {item.children?.map((child) => {
                          const isChildActive = isRouteActive(child.url);
                          const ChildIcon = child.icon;
                          return (
                            <DropdownMenuItem key={child.title} asChild className="cursor-pointer">
                              <Link
                                to={child.url}
                                className={cn(
                                   "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                                   isChildActive
                                     ? "bg-[#0f172a] text-white font-semibold shadow-2xs"
                                     : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                <span className="flex items-center gap-2.5 truncate">
                                  <ChildIcon className={cn("w-4 h-4 shrink-0", isChildActive ? "text-white" : "text-slate-400")} />
                                  <span className="truncate">{child.title}</span>
                                </span>
                                {child.badge && (
                                  <span className={cn(
                                    "ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                                    isChildActive ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-700 border border-rose-200/60"
                                  )}>
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              }

              // In expanded mode, render as Accordion
              return (
                <Collapsible
                  key={item.title}
                  open={isOpen}
                  onOpenChange={() => toggleGroup(item.title)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={hasActiveChild && !isOpen}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150",
                          hasActiveChild && !isOpen
                            ? "bg-slate-100/90 text-slate-900 font-bold"
                            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            hasActiveChild ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
                          )} />
                          <span className="truncate">{item.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight
                            className={cn(
                              "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                              isOpen && "rotate-90 text-slate-600"
                            )}
                          />
                        </div>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {/* Children Accordion Content */}
                    <CollapsibleContent className="transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      <SidebarMenuSub className="ml-4 pl-2.5 my-1 space-y-0.5 border-l border-slate-200/80">
                        {item.children?.map((child) => {
                          const isChildActive = isRouteActive(child.url);
                          return (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton asChild isActive={isChildActive} className="p-0 h-auto">
                                <SidebarSubLink
                                  to={child.url}
                                  title={child.title}
                                  icon={child.icon}
                                  badge={child.badge}
                                  isActive={isChildActive}
                                />
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        {/* 3. Footer with User Profile */}
        <SidebarFooter className="p-2 border-t border-slate-100 bg-white">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-2.5 rounded-xl transition-colors text-left outline-none hover:bg-slate-50",
                isCollapsed ? "p-1.5 justify-center" : "p-2"
              )}>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-5 h-5" />
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold truncate leading-tight text-slate-900">
                        {user?.full_name || user?.fullName || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {user?.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align={isCollapsed ? "start" : "end"}
              side={isCollapsed ? "right" : "top"}
              sideOffset={14}
              className="w-56 p-2 rounded-2xl shadow-xl border border-slate-200/80 bg-white z-50 text-xs font-sans"
            >
              <div className="px-2 py-1.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900 truncate">{user?.full_name || 'User'}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <Badge variant="outline" className="mt-1 text-[9px] px-1.5 py-0 bg-slate-50 text-slate-600 border-slate-200">
                  {userIsSuperAdmin ? 'Super Admin' : userIsHrAdmin ? 'HR Admin' : user?.role || 'User'}
                </Badge>
              </div>

              <DropdownMenuSeparator className="my-1 bg-slate-100" />

              {userIsSuperAdmin ? (
                <DropdownMenuItem onClick={() => navigate(PAGE_ROUTES.SETTINGS)} className="cursor-pointer">
                  <Settings className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  Settings
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => {
                    if (canSwitchViews) changeViewMode('EMPLOYEE');
                    navigate(PAGE_ROUTES.EMPLOYEE_SELF_SERVICE);
                  }} className="cursor-pointer">
                    <UserCircle className="w-3.5 h-3.5 mr-2 text-slate-500" />
                    My Portal Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    if (canSwitchViews) changeViewMode('EMPLOYEE');
                    navigate(`${PAGE_ROUTES.EMPLOYEE_SELF_SERVICE}?tab=profile`);
                  }} className="cursor-pointer">
                    <User className="w-3.5 h-3.5 mr-2 text-slate-500" />
                    My Profile & Records
                  </DropdownMenuItem>
                </>
              )}

              {canSwitchViews && (
                <DropdownMenuItem onClick={() => {
                  const newMode = viewMode === 'ADMIN' ? 'EMPLOYEE' : 'ADMIN';
                  changeViewMode(newMode);
                  navigate(newMode === 'ADMIN' ? PAGE_ROUTES.HOME : PAGE_ROUTES.EMPLOYEE_SELF_SERVICE);
                }} className="cursor-pointer">
                  {viewMode === 'ADMIN' ? <Briefcase className="w-3.5 h-3.5 mr-2 text-slate-500" /> : <Users className="w-3.5 h-3.5 mr-2 text-slate-500" />}
                  Switch to {viewMode === 'ADMIN' ? 'Employee Portal' : 'Admin Panel'}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="my-1 bg-slate-100" />

              <DropdownMenuItem onClick={handleLogout} className="text-rose-600 hover:bg-rose-50 cursor-pointer">
                <LogOut className="w-3.5 h-3.5 mr-2 text-rose-500" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* 4. Main Inset Area with Top Header Bar - Exact h-14 and border-b border-slate-200/70 */}
      <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden bg-slate-50">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/80 px-4 md:px-6 backdrop-blur-md shrink-0 box-border">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="text-slate-500 hover:text-slate-900 rounded-lg p-1.5 hover:bg-slate-100 transition-colors" />
            <Separator orientation="vertical" className="h-4 bg-slate-200/80" />
            
            <div className="flex items-center gap-1.5 text-xs truncate">
              <span className="font-medium text-slate-400">
                {currentParentItem?.title || 'Dashboard'}
              </span>
              {currentSubItem && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="font-semibold text-slate-800">
                    {currentSubItem.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {canSwitchViews && (
              <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-medium px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200/70 rounded-full">
                {viewMode === 'EMPLOYEE' ? 'Employee View' : 'Admin View'}
              </Badge>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
