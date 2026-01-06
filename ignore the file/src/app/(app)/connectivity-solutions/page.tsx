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
    Satellite,
    Share2,
    Cpu,
    Router,
    Gauge,
    ShieldCheck,
    Activity,
    Server
} from "lucide-react"

const connectivityFeatures = [
    {
        title: "Satellite Connectivity",
        description: "VSAT terminals for remote areas with limited internet.",
        icon: Satellite,
    },
    {
        title: "Mesh Networking",
        description: "Peer-to-peer connectivity for isolated locations.",
        icon: Share2,
    },
    {
        title: "Edge Computing",
        description: "Local processing nodes for improved performance.",
        icon: Cpu,
    },
    {
        title: "Multi-Network Support",
        description: "Support for multiple telecom networks for redundancy.",
        icon: Router,
    },
    {
        title: "Bandwidth Optimization",
        description: "Data compression and optimization for low-bandwidth areas.",
        icon: Gauge,
    },
    {
        title: "Connection Fallback",
        description: "Automatic fallback to alternative connectivity methods.",
        icon: ShieldCheck,
    },
    {
        title: "Network Monitoring",
        description: "Real-time network performance monitoring.",
        icon: Activity,
    },
    {
        title: "Proxy Services",
        description: "Proxy services for improved connectivity in remote areas.",
        icon: Server,
    }
];

export default function ConnectivitySolutionsPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Connectivity Solutions</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {connectivityFeatures.map((feature, index) => (
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
