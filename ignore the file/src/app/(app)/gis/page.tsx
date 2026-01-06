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
    MapPin,
    Navigation,
    Map,
    Satellite,
    LocateFixed,
    AreaChart,
    Smartphone
} from "lucide-react"

const gisFeatures = [
    {
        title: "Property Mapping",
        description: "Digital property boundary mapping and visualization on an interactive map.",
        icon: MapPin,
    },
    {
        title: "Location-Based Services",
        description: "GPS-enabled services for field collection and verification.",
        icon: Navigation,
    },
    {
        title: "Territory Management",
        description: "Digitally assign and manage territories for field collectors.",
        icon: Map,
    },
    {
        title: "Satellite Imagery",
        description: "Integrate with satellite imagery for up-to-date property assessment.",
        icon: Satellite,
    },
    {
        title: "Geocoding Services",
        description: "Standardize addresses and convert them to geographic coordinates.",
        icon: LocateFixed,
    },
    {
        title: "Spatial Analysis",
        description: "Utilize advanced spatial analysis for revenue optimization and planning.",
        icon: AreaChart,
    },
    {
        title: "Mobile Mapping",
        description: "Enable field mapping capabilities directly from mobile devices.",
        icon: Smartphone,
    }
];

export default function GisPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Geographic Information System (GIS)</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {gisFeatures.map((feature, index) => (
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
