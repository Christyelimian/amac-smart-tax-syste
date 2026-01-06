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
    BrainCircuit,
    TrendingUp,
    Users,
    ShieldCheck,
    Smile,
    LineChart,
    Search,
    Calculator,
} from "lucide-react"

const advancedAnalyticsFeatures = [
    {
        title: "Machine Learning",
        description: "Advanced machine learning algorithms for pattern recognition.",
        icon: BrainCircuit,
    },
    {
        title: "Predictive Modeling",
        description: "Predictive models for revenue forecasting and planning.",
        icon: TrendingUp,
    },
    {
        title: "Behavioral Analytics",
        description: "Taxpayer behavior analysis for improved service delivery.",
        icon: Users,
    },
    {
        title: "Risk Assessment",
        description: "Automated risk assessment for fraud prevention.",
        icon: ShieldCheck,
    },
    {
        title: "Sentiment Analysis",
        description: "Analysis of customer feedback and satisfaction.",
        icon: Smile,
    },
    {
        title: "Trend Analysis",
        description: "Long-term trend identification and analysis.",
        icon: LineChart,
    },
    {
        title: "Anomaly Detection",
        description: "Automated detection of unusual patterns and activities.",
        icon: Search,
    },
    {
        title: "Statistical Modeling",
        description: "Advanced statistical models for data analysis.",
        icon: Calculator,
    }
];

export default function AdvancedAnalyticsPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {advancedAnalyticsFeatures.map((feature, index) => (
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
