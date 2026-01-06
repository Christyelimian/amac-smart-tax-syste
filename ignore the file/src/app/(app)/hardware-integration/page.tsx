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
    CreditCard,
    Smartphone,
    AppWindow,
    Barcode,
    Printer,
    Fingerprint,
    Nfc,
    Sun,
} from "lucide-react"

const hardwareFeatures = [
    {
        title: "POS Terminals",
        description: "Point-of-sale terminal integration for seamless card payments.",
        icon: CreditCard,
    },
    {
        title: "Mobile Devices",
        description: "Smartphone and tablet integration for versatile field operations.",
        icon: Smartphone,
    },
    {
        title: "Self-Service Kiosks",
        description: "Automated kiosks for convenient self-service payments.",
        icon: AppWindow,
    },
    {
        title: "Barcode Scanners",
        description: "Handheld barcode scanners for quick and accurate identification.",
        icon: Barcode,
    },
    {
        title: "Receipt Printers",
        description: "Thermal receipt printers for instant payment confirmation on the go.",
        icon: Printer,
    },
    {
        title: "Biometric Devices",
        description: "Fingerprint and facial recognition hardware for secure authentication.",
        icon: Fingerprint,
    },
    {
        title: "NFC Readers",
        description: "Near Field Communication readers for fast, contactless payments.",
        icon: Nfc,
    },
    {
        title: "Solar Charging",
        description: "Solar-powered charging solutions for remote and off-grid operations.",
        icon: Sun,
    }
];

export default function HardwareIntegrationPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Hardware Integration</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {hardwareFeatures.map((feature, index) => (
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
                                    View Details
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
