import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/constants';
import {
  Loader2,
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const EXAMPLE_PROMPTS = [
  "Which zones are underperforming this month?",
  "Show me payers who haven't paid in 60 days",
  "What's our revenue trend for the last week?",
  "Which revenue type generates the most income?",
  "Generate a summary report for today",
];

export default function AdminInsights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(user ? '/dashboard' : '/auth');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchRelevantData = async (query: string) => {
    const lowerQuery = query.toLowerCase();
    const data: Record<string, unknown> = {};

    try {
      // Get basic stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Fetch recent payments
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (recentPayments) {
        data.recentPayments = recentPayments.length;
        data.totalRevenue = recentPayments
          .filter(p => p.status === 'confirmed')
          .reduce((sum, p) => sum + Number(p.amount), 0);
      }

      // Zone performance
      if (lowerQuery.includes('zone') || lowerQuery.includes('underperforming')) {
        const { data: zoneData } = await supabase
          .from('payments')
          .select('zone, amount')
          .eq('status', 'confirmed')
          .gte('created_at', monthAgo.toISOString());

        if (zoneData) {
          const zoneAgg: Record<string, number> = {};
          zoneData.forEach(p => {
            zoneAgg[p.zone] = (zoneAgg[p.zone] || 0) + Number(p.amount);
          });
          data.zonePerformance = zoneAgg;
        }
      }

      // Revenue by type
      if (lowerQuery.includes('revenue type') || lowerQuery.includes('most income')) {
        const { data: typeData } = await supabase
          .from('payments')
          .select('revenue_type, amount')
          .eq('status', 'confirmed')
          .gte('created_at', monthAgo.toISOString());

        if (typeData) {
          const typeAgg: Record<string, number> = {};
          typeData.forEach(p => {
            typeAgg[p.revenue_type] = (typeAgg[p.revenue_type] || 0) + Number(p.amount);
          });
          data.revenueByType = Object.entries(typeAgg)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        }
      }

      // Inactive payers
      if (lowerQuery.includes('haven\'t paid') || lowerQuery.includes('inactive') || lowerQuery.includes('defaulter')) {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const { data: allPayments } = await supabase
          .from('payments')
          .select('payer_email, payer_name, created_at')
          .order('created_at', { ascending: false });

        if (allPayments) {
          const lastPaymentByPayer: Record<string, { name: string; date: string }> = {};
          allPayments.forEach(p => {
            if (p.payer_email && !lastPaymentByPayer[p.payer_email]) {
              lastPaymentByPayer[p.payer_email] = {
                name: p.payer_name,
                date: p.created_at,
              };
            }
          });

          const inactivePayers = Object.entries(lastPaymentByPayer)
            .filter(([_, info]) => new Date(info.date) < sixtyDaysAgo)
            .slice(0, 20);

          data.inactivePayers = inactivePayers.map(([email, info]) => ({
            email,
            name: info.name,
            lastPayment: info.date,
          }));
        }
      }

      // Daily trend
      if (lowerQuery.includes('trend') || lowerQuery.includes('daily')) {
        const { data: dailyData } = await supabase
          .from('payments')
          .select('created_at, amount')
          .eq('status', 'confirmed')
          .gte('created_at', weekAgo.toISOString());

        if (dailyData) {
          const dailyAgg: Record<string, number> = {};
          dailyData.forEach(p => {
            const date = p.created_at.split('T')[0];
            dailyAgg[date] = (dailyAgg[date] || 0) + Number(p.amount);
          });
          data.dailyTrend = Object.entries(dailyAgg).sort((a, b) => a[0].localeCompare(b[0]));
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    }

    return data;
  };

  const handleSend = async (message?: string) => {
    const query = message || input;
    if (!query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch relevant data based on query
      const contextData = await fetchRelevantData(query);

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: `You are AMAC Revenue AI Assistant for the admin dashboard. You help administrators analyze revenue data and generate insights.

Available data from the system:
${JSON.stringify(contextData, null, 2)}

User query: ${query}

Provide a helpful, concise response based on the data. Format numbers as Nigerian Naira (₦) where applicable. If the data doesn't contain what's needed, explain what you can see and suggest alternative queries.`,
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.response || 'I apologize, but I was unable to process your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-12rem)] flex flex-col fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-display font-bold">AI Insights</h1>
          </div>
          <p className="text-muted-foreground">
            Ask questions about revenue data, get insights, and generate reports
          </p>
        </div>

        {/* Chat Container */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AMAC Revenue AI Assistant</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Ask me anything about revenue collections, payer behavior, zone performance, or request reports.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                    {EXAMPLE_PROMPTS.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSend(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-50 mt-1">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Analyzing data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about revenue, zones, payers, trends..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
