import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  MapPin,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useOffline } from '@/contexts/OfflineContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Collect Payment', href: '/collect', icon: CreditCard },
  { name: 'Daily Report', href: '/report', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function CollectorLayout() {
  const { collector, logout } = useAuth();
  const { isOnline, pendingSyncCount } = useOffline();
  const { currentLocation } = useLocationContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">AMAC Collector</h1>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {collector?.collector_id}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {collector?.zone.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                <Badge
                  variant={isOnline ? "default" : "destructive"}
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {isOnline ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  <span className="text-xs hidden sm:inline">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </Badge>

                {pendingSyncCount > 0 && (
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 px-2 py-1">
                    <span className="text-xs">{pendingSyncCount} pending</span>
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    'flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Location Bar */}
      {currentLocation && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center text-sm text-blue-700">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                Current Location: {currentLocation.address ||
                  `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
