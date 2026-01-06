import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Home, Map, ShieldAlert, Smile, TrendingUp, BrainCircuit } from "lucide-react"

const aiTools = [
    {
        title: "Fraud Detection",
        description: "Analyze transactions to identify potential fraud and suspicious activities in real-time.",
        icon: ShieldAlert,
        link: "/#fraud-detector" // Link to the section on the dashboard for now
    },
    {
        title: "Revenue Forecasting",
        description: "Use predictive analytics to project future revenue and assist in budget planning.",
        icon: TrendingUp,
    },
    {
        title: "Property Valuation",
        description: "Automatically estimate property values using AI and market data for fair taxation.",
        icon: Home,
    },
    {
        title: "Smart Routing",
        description: "Optimize routes for field collectors to maximize efficiency and revenue collection.",
        icon: Map,
    },
    {
        title: "Sentiment Analysis",
        description: "Analyze taxpayer feedback to gauge satisfaction and identify areas for improvement.",
        icon: Smile,
    },
    {
        title: "WhatsApp Chatbot",
        description: "Provide instant support and payment assistance to citizens via a smart chatbot.",
        icon: Bot,
    },
    {
        title: "Advanced Analytics",
        description: "Explore machine learning models for deeper insights and predictions.",
        icon: BrainCircuit,
        link: "/advanced-analytics"
    }
]

export default function AiToolsPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">AI Tools</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {aiTools.map((tool, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader>
                             <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle>{tool.title}</CardTitle>
                                    <CardDescription>{tool.description}</CardDescription>
                                </div>
                                <tool.icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardFooter className="mt-auto">
                            <Button size="sm" variant="outline" asChild>
                                <a href={tool.link || '#'}>
                                    Use Tool
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
