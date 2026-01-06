import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Users,
    TrendingUp,
    Filter,
    Globe
} from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { UserEngagementChart } from "@/components/dashboard/user-engagement-chart"
import { ComplianceFunnelChart } from "@/components/dashboard/compliance-funnel-chart"


export default function AnalyticsPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <StatCard
                    title="User Engagement"
                    value="78.2%"
                    icon={Users}
                    description="Avg. session duration: 12m 30s"
                />
                <StatCard
                    title="Revenue Trend"
                    value="+15.3%"
                    icon={TrendingUp}
                    description="Compared to last quarter"
                />
                <StatCard
                    title="Compliance Funnel"
                    value="65.4%"
                    icon={Filter}
                    description="Conversion from notice to payment"
                />
                <StatCard
                    title="Geospatial Hotspots"
                    value="3 Areas"
                    icon={Globe}
                    description="High collection activity"
                />
            </div>
            <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>User Engagement Over Time</CardTitle>
                        <CardDescription>
                            Daily active users and session duration trends.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <UserEngagementChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Tax Compliance Funnel</CardTitle>
                        <CardDescription>
                           From initial notice to final payment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ComplianceFunnelChart />
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
