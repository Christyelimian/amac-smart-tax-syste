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
    Home,
    FileText,
    Car,
    Store,
    School,
    Hotel,
    Building,
    Briefcase
} from "lucide-react"

const specializedModules = [
    {
        title: "Tenement Management",
        description: "Manage Tenement Rates and property habitation fitness.",
        icon: Building,
    },
    {
        title: "Business & Operational Permits",
        description: "Comprehensive permit tracking for all business premises.",
        icon: Briefcase,
    },
    {
        title: "Vehicle & Haulage",
        description: "Motor vehicle, tricycle, and ride-hailing registration management.",
        icon: Car,
    },
    {
        title: "Market Management",
        description: "Specialized module for market shops, stalls, and kiosk fees.",
        icon: Store,
    },
    {
        title: "Hotel & Tourism",
        description: "Manage permits and fees for hotels and hospitality businesses.",
        icon: Hotel,
    },
    {
        title: "Land Use & Construction",
        description: "Track building materials, construction, and street naming fees.",
        icon: Home,
    },
    {
        title: "School Management",
        description: "Private school permit and fee management system.",
        icon: School,
    },
    {
        title: "Advertisements & Signage",
        description: "Manage mobile advertising and signpost permits.",
        icon: FileText,
    }
];

export default function SpecializedModulesPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Specialized Revenue Modules</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {specializedModules.map((feature, index) => (
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
                                    Explore Module
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
