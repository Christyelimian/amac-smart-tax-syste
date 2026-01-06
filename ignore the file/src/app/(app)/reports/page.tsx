import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, BarChart, FileText, PieChart } from "lucide-react"

const reports = [
    {
        title: "Monthly Revenue Report",
        description: "A detailed breakdown of revenue by source for the last month.",
        icon: BarChart,
    },
    {
        title: "Taxpayer Compliance Report",
        description: "Analysis of taxpayer compliance rates and trends.",
        icon: FileText,
    },
    {
        title: "Collections by Agent",
        description: "Summary of collections made by each field agent.",
        icon: PieChart,
    },
    {
        title: "Quarterly Performance Review",
        description: "High-level overview of key performance indicators for the quarter.",
        icon: BarChart,
    }
]

export default function ReportsPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                             <div className="space-y-1.5">
                                <CardTitle>{report.title}</CardTitle>
                                <CardDescription>{report.description}</CardDescription>
                            </div>
                           <report.icon className="h-6 w-6 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <Button size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download Report
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    )
}
