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
    CalendarDays,
    TrendingUp,
    Award,
    Target,
    BellRing,
    Gauge,
    Gamepad2
} from "lucide-react"

const collectionFeatures = [
    {
        title: "Collection Scheduling",
        description: "Automated scheduling system for all collection activities.",
        icon: CalendarDays,
    },
    {
        title: "Performance Tracking",
        description: "Real-time performance monitoring for individual field collectors.",
        icon: TrendingUp,
    },
    {
        title: "Incentive Management",
        description: "Automated incentive calculation and distribution based on performance.",
        icon: Award,
    },
    {
        title: "Target Setting",
        description: "Dynamic target setting for collectors based on historical data.",
        icon: Target,
    },
    {
        title: "Collection Reminders",
        description: "Automated reminders sent to taxpayers for pending collections.",
        icon: BellRing,
    },
    {
        title: "Efficiency Metrics",
        description: "Track key efficiency metrics and performance indicators for the team.",
        icon: Gauge,
    },
    {
        title: "Gamification",
        description: "Introduce game-like elements to motivate collectors and boost performance.",
        icon: Gamepad2,
    }
];

export default function CollectionOptimizationPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Collection Optimization</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {collectionFeatures.map((feature, index) => (
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
