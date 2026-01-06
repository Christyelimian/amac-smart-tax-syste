import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavLink } from '@/components/NavLink';

interface PWANavigationProps {
  children?: React.ReactNode;
}

export function PWANavigation({ children }: PWANavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsPWA(isStandalone || isInWebAppiOS);
    };

    checkPWA();
    setCanGoBack(window.history.length > 1 && location.pathname !== '/');
  }, [location.pathname]);

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  // Quick actions for PWA mode
  const quickActions = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/portal', label: 'Portal' },
    { path: '/services', label: 'Services' },
    { path: '/revenue', label: 'Revenue' },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  if (!isPWA) {
    return <>{children}</>;
  }

  return (
    <>
      {/* PWA Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {canGoBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHome}
            className="h-8 w-8 p-0"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-sm font-semibold text-gray-900 truncate">
            AMAC
          </h1>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <NavLink
                    key={action.path}
                    to={action.path}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {action.icon && <action.icon className="h-4 w-4" />}
                    <span>{action.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Content with top padding for navigation */}
      <div className="pt-12">
        {children}
      </div>
    </>
  );
}
