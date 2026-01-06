import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowRight,
    Calculator,
    Coins,
    FileBarChart2,
    Gavel,
    GitCompareArrows,
    PieChart,
    PiggyBank,
    Undo2
} from "lucide-react"

const financialFeatures = [
    {
        title: "Transaction Reconciliation",
        description: "Two-way automated reconciliation (30% to Partners, 70% to AMAC).",
        icon: GitCompareArrows,
    },
    {
        title: "Revenue Allocation",
        description: "Automatic revenue distribution based on predefined ratios.",
        icon: PieChart,
    },
    {
        title: "Financial Reporting",
        description: "Comprehensive financial reports and statements.",
        icon: FileBarChart2,
    },
    {
        title: "Budget Integration",
        description: "Integration with AMAC's budget planning and monitoring systems.",
        icon: PiggyBank,
    },
    {
        title: "Tax Calculation",
        description: "Automated tax calculation based on property values and business types.",
        icon: Calculator,
    },
    {
        title: "Penalty Management",
        description: "Automated penalty calculation for late payments and non-compliance.",
        icon: Gavel,
    },
    {
        title: "Refund Processing",
        description: "Streamlined refund processing with audit trail.",
        icon: Undo2,
    },
    {
        title: "Multi-Currency Support",
        description: "Support for multiple currencies and exchange rate management.",
        icon: Coins,
    }
];

export default function FinancialManagementPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {financialFeatures.map((feature, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </div>
                                <feature.icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardFooter className="mt-auto">
                            <Button size="sm" variant="outline" asChild>
                                <a href="#">
                                    Explore Feature
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </main>
    )
}
