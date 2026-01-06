import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Receipt,
  TrendingUp,
  MapPin,
  Clock,
  Battery,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

export default function Dashboard() {
  const { collector } = useAuth();
  const { isOnline, pendingSyncCount, syncData } = useOffline();
  const navigate = useNavigate();

  // Mock data - in a real app, this would come from an API
  const [stats, setStats] = useState({
    todayCollections: 18,
    todayAmount: 245000,
    targetAmount: 500000,
    cashAmount: 180000,
    posAmount: 65000,
    batteryLevel: 87,
    lastSync: new Date().toISOString(),
  });

  const [recentCollections, setRecentCollections] = useState([
    {
      id: '1',
      amount: 15000,
      type: 'Shop License',
      time: '10:45 AM',
      status: 'completed',
      location: 'Wuse Market'
    },
    {
      id: '2',
      amount: 30000,
      type: 'Tenement Rate',
      time: '10:20 AM',
      status: 'completed',
      location: 'Garki Estate'
    },
    {
      id: '3',
      amount: 12000,
      type: 'Fumigation Service',
      time: '9:55 AM',
      status: 'pending',
      location: 'Karmo Market'
    },
  ]);

  const targetProgress = (stats.todayAmount / stats.targetAmount) * 100;
  const cashPercentage = (stats.cashAmount / stats.todayAmount) * 100;
  const posPercentage = (stats.posAmount / stats.todayAmount) * 100;

  const handleSync = async () => {
    await syncData();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {collector?.full_name}
          </h1>
          <p className="text-gray-600">
            {collector?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • Zone {collector?.zone.toUpperCase()}
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {new Date().toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Badge>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                )}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Battery className="h-3 w-3" />
                  {stats.batteryLevel}%
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date().toLocaleTimeString('en-NG', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Badge>
              </div>
            </div>
            {pendingSyncCount > 0 && (
              <Button onClick={handleSync} variant="outline" size="sm">
                Sync {pendingSyncCount} items
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Collection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collections</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCollections}</div>
            <p className="text-xs text-muted-foreground">
              transactions completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayAmount)}</div>
            <p className="text-xs text-muted-foreground">
              collected today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Collections</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.cashAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {cashPercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">POS Collections</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.posAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {posPercentage.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Target Progress</CardTitle>
          <CardDescription>
            Target: {formatCurrency(stats.targetAmount)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{targetProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(targetProgress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatCurrency(stats.todayAmount)} collected</span>
              <span>{formatCurrency(stats.targetAmount - stats.todayAmount)} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/collect')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">Collect Payment</span>
            </Button>
            <Button
              onClick={() => navigate('/report')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Daily Report</span>
            </Button>
            <Button
              onClick={() => navigate('/receipt')}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Receipt className="h-6 w-6" />
              <span className="text-sm">View Receipts</span>
            </Button>
            <Button
              onClick={handleSync}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <Wifi className="h-6 w-6" />
              <span className="text-sm">Sync Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Collections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Collections</CardTitle>
          <CardDescription>Your latest payment collections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCollections.map((collection) => (
              <div key={collection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    collection.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium">{formatCurrency(collection.amount)}</p>
                    <p className="text-sm text-gray-500">{collection.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{collection.time}</p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {collection.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
