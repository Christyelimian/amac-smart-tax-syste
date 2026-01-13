import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  Bot,
  LogOut,
  Menu,
  Bell,
  Search,
  Shield,
  AlertTriangle,
  ScrollText,
  Activity,
  Wallet,
  Receipt,
  Banknote,
  Building,
  MapPin,
  Truck,
  FileBarChart,
  Lightbulb,
  UserCog,
  Smartphone,
  HelpCircle,
  Database,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },

  // REVENUE MANAGEMENT
  { type: 'header', label: 'REVENUE MANAGEMENT' },
  { href: '/admin/transactions', label: 'All Transactions', icon: CreditCard },
  { href: '/admin/verify-payments', label: 'Verify Payments', icon: Activity },
  { href: '/admin/revenue-types', label: '51 Revenue Types', icon: Banknote },
  { href: '/admin/revenue-analytics', label: 'Revenue Analytics', icon: BarChart3 },
  { href: '/admin/targets', label: 'Targets & Goals', icon: FileBarChart },

  // RECEIPTS
  { type: 'header', label: 'RECEIPTS' },
  { href: '/admin/receipts', label: 'All Receipts', icon: Receipt },
  { href: '/admin/regenerate-receipts', label: 'Regenerate', icon: Receipt },
  { href: '/admin/resend-receipts', label: 'Resend', icon: Receipt },
  { href: '/admin/validate-receipts', label: 'Validate (QR)', icon: Receipt },

  // BANK RECONCILIATION
  { type: 'header', label: 'BANK RECONCILIATION' },
  { href: '/admin/bank-connect', label: 'Connect Banks', icon: Building },
  { href: '/admin/auto-reconcile', label: 'Auto Reconcile', icon: Building },
  { href: '/admin/reconcile-discrepancies', label: 'Discrepancies', icon: Building },
  { href: '/admin/reconciliation-reports', label: 'Reconciliation Rpt', icon: FileBarChart },

  // TAXPAYER MANAGEMENT
  { type: 'header', label: 'TAXPAYER MANAGEMENT' },
  { href: '/admin/payers', label: 'All Taxpayers', icon: Users },
  { href: '/admin/businesses', label: 'Businesses', icon: Building },
  { href: '/admin/properties', label: 'Properties', icon: MapPin },
  { href: '/admin/send-reminders', label: 'Send Reminders', icon: Bell },
  { href: '/admin/compliance', label: 'Compliance Rate', icon: FileBarChart },

  // COLLECTOR MANAGEMENT
  { type: 'header', label: 'COLLECTOR MANAGEMENT' },
  { href: '/admin/collectors', label: 'All Collectors', icon: Truck },
  { href: '/admin/zone-assignment', label: 'Zone Assignment', icon: MapPin },
  { href: '/admin/performance', label: 'Performance', icon: BarChart3 },
  { href: '/admin/collections-today', label: 'Collections Today', icon: Wallet },
  { href: '/admin/field-app-monitor', label: 'Field App Monitor', icon: Smartphone },

  // REPORTS & ANALYTICS
  { type: 'header', label: 'REPORTS & ANALYTICS' },
  { href: '/admin/revenue-reports', label: 'Revenue Reports', icon: FileBarChart },
  { href: '/admin/financial-statements', label: 'Financial Statements', icon: FileBarChart },
  { href: '/admin/trend-analysis', label: 'Trend Analysis', icon: BarChart3 },
  { href: '/admin/target-actual', label: 'Target vs Actual', icon: FileBarChart },
  { href: '/admin/export-data', label: 'Export Data', icon: FileBarChart },

  // AI TOOLS
  { type: 'header', label: 'AI TOOLS' },
  { href: '/admin/fraud-detection', label: 'Fraud Detection', icon: Shield },
  { href: '/admin/revenue-forecast', label: 'Revenue Forecast', icon: Lightbulb },
  { href: '/admin/smart-insights', label: 'Smart Insights', icon: Lightbulb },
  { href: '/admin/smart-routing', label: 'Smart Routing', icon: MapPin },

  // USER MANAGEMENT
  { type: 'header', label: 'USER MANAGEMENT' },
  { href: '/admin/users', label: 'All Users', icon: UserCog },
  { href: '/admin/roles-permissions', label: 'Roles & Permissions', icon: Shield },
  { href: '/admin/activity-log', label: 'Activity Log', icon: ScrollText },
  { href: '/admin/add-user', label: 'Add New User', icon: UserCog },

  // SETTINGS
  { type: 'header', label: 'SETTINGS' },
  { href: '/admin/payment-gateways', label: 'Payment Gateways', icon: CreditCard },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/revenue-types-settings', label: 'Revenue Types', icon: Banknote },
  { href: '/admin/zones-locations', label: 'Zones & Locations', icon: MapPin },
  { href: '/admin/system-config', label: 'System Config', icon: Settings },
  { href: '/admin/security', label: 'Security', icon: Shield },

  // MOBILE APP
  { type: 'header', label: 'MOBILE APP' },
  { href: '/admin/collector-app', label: 'Collector App', icon: Smartphone },
  { href: '/admin/active-users', label: 'Active Users', icon: Users },
  { href: '/admin/app-analytics', label: 'App Analytics', icon: BarChart3 },

  // DATA FEED SYSTEM (Super Admin Only)
  { type: 'header', label: 'DATA FEED SYSTEM' },
  { href: 'http://localhost:5173/admin', label: 'Data Feed Dashboard', icon: Database, external: true },

  // HELP & SUPPORT
  { type: 'header', label: 'HELP & SUPPORT' },
  { href: '/admin/documentation', label: 'Documentation', icon: HelpCircle },
  { href: '/admin/training', label: 'Training Videos', icon: HelpCircle },
  { href: '/admin/contact-support', label: 'Contact Support', icon: HelpCircle },
  { href: '/admin/report-bug', label: 'Report Bug', icon: AlertTriangle },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const isSuperAdmin = roles.some(r => r.role === 'super_admin');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const NavContent = () => (
    <nav className="space-y-1">
      {navItems.map((item, index) => {
        // Skip data feed system section if not super admin
        if (item.type === 'header' && item.label === 'DATA FEED SYSTEM' && !isSuperAdmin) {
          return null;
        }

        // Skip data feed system navigation item if not super admin
        if (item.href === 'http://localhost:5173/admin' && !isSuperAdmin) {
          return null;
        }

        if (item.type === 'header') {
          return (
            <div key={`header-${index}`} className="px-4 py-2 mt-6 first:mt-0">
              <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                {item.label}
              </h3>
            </div>
          );
        }

        const isActive = location.pathname === item.href;
        const isExternal = item.external;

        if (isExternal) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-0.5'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
              <span className="text-xs text-sidebar-foreground/40">↗</span>
            </a>
          );
        }

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-0.5'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 admin-sidebar border-sidebar-border">
                <div className="p-6 border-b border-sidebar-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center">
                      <Shield className="h-6 w-6 text-sidebar-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-sidebar-foreground">AMAC</h2>
                      <p className="text-xs text-sidebar-foreground/60">STREAMS Platform</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="font-display font-bold text-lg">AMAC Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.full_name || 'John Doe'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    <p className="text-xs text-muted-foreground">Super Admin</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  Role: Super Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 admin-sidebar border-r border-sidebar-border">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Shield className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display font-bold text-sidebar-foreground">AMAC</h2>
                <p className="text-xs text-sidebar-foreground/60">STREAMS Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <NavContent />
            </div>
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground">{profile?.full_name || 'John Doe'}</p>
                    <p className="text-xs text-sidebar-foreground/60">Super Admin</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.full_name || 'John Doe'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                    <p className="text-xs text-muted-foreground">Super Admin</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  Role: Super Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-72">
          <div className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-border bg-card/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold">AMAC REVENUE MANAGEMENT SYSTEM</h1>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('en-NG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="live-indicator">
                <span>LIVE</span>
              </div>
              <span className="text-sm text-muted-foreground">👤 {profile?.full_name || 'John Doe'} (Admin)</span>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <Button variant="ghost" size="icon">
                🌙
              </Button>
              <Button variant="ghost" size="icon">
                ⚙️
              </Button>
            </div>
          </div>
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
