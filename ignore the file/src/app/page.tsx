import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  Search,
  Home,
  Store,
  Hotel,
  Bike,
  CreditCard,
  SprayCan,
  ShieldCheck,
  Zap,
  Smartphone,
  Mail,
  MessageSquare,
} from "lucide-react";

const popularServices = [
  { title: "Tenement Rate", icon: Home, link: "/remita-payment" },
  { title: "Shop & Kiosk", icon: Store, link: "/remita-payment" },
  { title: "Hotel License", icon: Hotel, link: "/remita-payment" },
  { title: "Motorcycle Permit", icon: Bike, link: "/remita-payment" },
  { title: "POS License", icon: CreditCard, link: "/remita-payment" },
  { title: "Fumigation Service", icon: SprayCan, link: "/remita-payment" },
];

const benefits = [
    { title: 'INSTANT', description: 'Payment confirmed in seconds', icon: Zap },
    { title: 'SECURE', description: 'Bank-grade encryption', icon: ShieldCheck },
    { title: 'CONVENIENT', description: 'Pay from anywhere, anytime', icon: Smartphone },
];


export default function PublicHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="px-4 lg:px-6 h-16 flex items-center shadow-sm bg-white dark:bg-gray-900">
        <Link href="/" className="flex items-center justify-center">
          <Landmark className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">AMAC Payment Portal</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="outline" asChild>
            <Link href="/login">Admin & Collector Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Register</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary/5 dark:bg-primary/10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Abuja Municipal Area Council
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Official Payment Portal - Pay Your Levies & Taxes Online - Fast & Secure
                </p>
              </div>
              <div className="w-full max-w-lg space-y-2">
                <form className="flex space-x-2">
                  <Input
                    type="search"
                    placeholder='e.g., "shop license", "hotel", "tenement"'
                    className="flex-1"
                  />
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                Popular Services
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Or choose from our most popular revenue types.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 py-12 sm:grid-cols-3 lg:grid-cols-6">
              {popularServices.map((service) => (
                <Link href={service.link} key={service.title} className="group">
                  <Card className="flex flex-col items-center justify-center p-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 h-full">
                    <service.icon className="w-10 h-10 mb-4 text-primary" />
                    <p className="text-sm font-medium text-center">{service.title}</p>
                  </Card>
                </Link>
              ))}
            </div>
             <div className="text-center">
                <Button variant="outline" asChild>
                    <Link href="/remita-payment">View All 51 Revenue Types &rarr;</Link>
                </Button>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Why Pay With AMAC Pay Portal?</h2>
                    <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">The official, secure, and most convenient way to pay your AMAC levies.</p>
                </div>
                <div className="mx-auto w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8">
                    {benefits.map(benefit => (
                        <div key={benefit.title} className="flex flex-col items-center gap-2">
                            <benefit.icon className="w-12 h-12 text-primary" />
                            <h3 className="text-xl font-bold">{benefit.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Abuja Municipal Area Council. All rights reserved.
        </p>
        <div className="sm:ml-auto flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@amacpay.ng" className="text-xs hover:underline underline-offset-4">
                    support@amacpay.ng
                </a>
            </div>
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                 <a href="#" className="text-xs hover:underline underline-offset-4">
                    WhatsApp: +234-XXX-XXX-XXXX
                </a>
            </div>
        </div>
      </footer>
    </div>
  );
}
