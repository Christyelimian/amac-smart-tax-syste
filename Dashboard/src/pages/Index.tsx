import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  CreditCard,
  BarChart3,
  Users,
  Bot,
  ArrowRight,
  Check,
  Building2,
  Zap,
} from 'lucide-react';

export default function Index() {
  const { user, isAdmin } = useAuth();

  const features = [
    {
      icon: CreditCard,
      title: 'Easy Payments',
      description: 'Pay your taxes and levies online with multiple payment options',
    },
    {
      icon: Building2,
      title: 'Property Management',
      description: 'Register and manage all your properties and businesses in one place',
    },
    {
      icon: BarChart3,
      title: 'Real-time Tracking',
      description: 'Monitor your payment history and compliance status instantly',
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Get instant help with payments and queries using our smart assistant',
    },
  ];

  const stats = [
    { value: '₦50B+', label: 'Revenue Collected' },
    { value: '100K+', label: 'Registered Taxpayers' },
    { value: '51', label: 'Revenue Types' },
    { value: '4', label: 'Zones Covered' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">AMAC Revenue</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pay Now
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link to={isAdmin ? '/admin' : '/dashboard'}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-success/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative pt-20 pb-24 lg:pt-32 lg:pb-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success border border-success/20">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Now with AI-powered assistance</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
              Smart Revenue Collection for{' '}
              <span className="text-gradient-hero">Modern Abuja</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              The official revenue collection platform for Abuja Municipal Area Council. 
              Pay taxes, register properties, and manage your compliance with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/auth">
                  Start Paying Online
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/auth">
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30 border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-1">
                <p className="text-3xl md:text-4xl font-display font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Everything You Need to Stay Compliant
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform for managing your taxes, licenses, and levies with AMAC
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-display font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Why Choose AMAC Smart Revenue?
              </h2>
              <div className="space-y-4">
                {[
                  'Instant payment confirmation and receipt generation',
                  'Track all your properties and businesses in one place',
                  'AI-powered assistant available 24/7',
                  'Secure and encrypted transactions',
                  'Multiple payment options including cards and bank transfer',
                  'Real-time compliance monitoring',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-success-foreground" />
                    </div>
                    <p className="text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
              <Button asChild>
                <Link to="/auth">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-success/10 to-warning/10 rounded-3xl blur-2xl" />
              <Card className="relative overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Taxpayer Portal</p>
                        <p className="text-sm text-muted-foreground">Your dashboard awaits</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {['Business Premises Permit', 'Property Tax', 'Hotel License'].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="text-sm">{item}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">Paid</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-8 md:p-12 lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary-foreground/10 via-transparent to-transparent" />
            <div className="relative text-center space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-primary-foreground/80">
                Join thousands of Abuja residents who have simplified their tax payments with AMAC Smart Revenue.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">
                  Create Your Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">AMAC Revenue</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2026 Abuja Municipal Area Council. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
