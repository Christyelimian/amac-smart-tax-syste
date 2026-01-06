import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DollarSign,
  Users,
  BadgePercent,
  WalletCards,
  MapPin,
  Wallet,
  Bike,
  ArrowRight
} from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { FraudDetector } from "@/components/dashboard/fraud-detector"
import { Button } from "@/components/ui/button"

const keyModules = [
  {
    title: "GIS Mapping",
    description: "Visualize property data and manage territories.",
    icon: MapPin,
    link: "/gis",
    linkText: "View Map"
  },
  {
    title: "Financials",
    description: "Reconcile transactions and manage revenue.",
    icon: Wallet,
    link: "/financial-management",
    linkText: "View Financials"
  },
  {
    title: "Collection Optimization",
    description: "Optimize field collector routes and schedules.",
    icon: Bike,
    link: "/collection-optimization",
    linkText: "Optimize Routes"
  },
]

export default function AdminDashboardPage() {
  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="₦45,231,890.00"
          icon={DollarSign}
          description="+20.1% from last month"
        />
        <StatCard
          title="Compliance Rate"
          value="87.5%"
          icon={BadgePercent}
          description="+1.2% from last month"
        />
        <StatCard
          title="Active Payers"
          value="+12,234"
          icon={Users}
          description="+501 this month"
        />
        <StatCard
          title="Collections Today"
          value="₦1,250,340.00"
          icon={WalletCards}
          description="From 432 transactions"
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              A summary of revenue collected over the past 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
        <RecentTransactions />
      </div>
      <div id="fraud-detector">
        <FraudDetector />
      </div>
      <Card>
          <CardHeader>
            <CardTitle>Explore Key Modules</CardTitle>
            <CardDescription>
              Dive deeper into the powerful features of STREAMS.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            {keyModules.map((module) => (
              <Card key={module.title} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <module.icon className="h-8 w-8 text-muted-foreground mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">{module.title}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                   <Button asChild variant="outline" size="sm">
                      <Link href={module.link}>
                        {module.linkText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
    </main>
  )
}
