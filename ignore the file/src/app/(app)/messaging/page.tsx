import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Send, MessageSquare, Mail, Phone, Bot } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/dashboard/stat-card"

const recentMessages = [
    { id: 'MSG-001', recipient: '+2348012345678', status: 'Delivered', date: '2024-05-21', channel: 'SMS' },
    { id: 'MSG-002', recipient: 'taxpayer@example.com', status: 'Sent', date: '2024-05-21', channel: 'Email' },
    { id: 'MSG-003', recipient: '+2348098765432', status: 'Read', date: '2024-05-20', channel: 'WhatsApp' },
    { id: 'MSG-004', recipient: '+2347011223344', status: 'Failed', date: '2024-05-20', channel: 'SMS' },
    { id: 'MSG-005', recipient: 'anotherpayer@example.com', status: 'Delivered', date: '2024-05-19', channel: 'Email' },
]

export default function MessagingPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Messaging Management</h1>
                <div className="flex items-center gap-2">
                     <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Export History
                    </Button>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Compose Message
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <StatCard
                    title="Total Messages Sent"
                    value="1,254"
                    icon={Send}
                    description="Last 30 days"
                />
                <StatCard
                    title="Delivery Rate"
                    value="98.2%"
                    icon={MessageSquare}
                    description="Across all channels"
                />
                <StatCard
                    title="Open Rate (Email)"
                    value="45.7%"
                    icon={Mail}
                    description="+2.1% this week"
                />
                <StatCard
                    title="Read Rate (WhatsApp)"
                    value="89.1%"
                    icon={Bot}
                    description="High engagement channel"
                />
            </div>

            <Tabs defaultValue="all">
                <div className="flex items-center">
                     <TabsList>
                        <TabsTrigger value="all">All Channels</TabsTrigger>
                        <TabsTrigger value="sms">
                            <MessageSquare className="mr-2 h-4 w-4" /> SMS
                        </TabsTrigger>
                        <TabsTrigger value="email">
                            <Mail className="mr-2 h-4 w-4" /> Email
                        </TabsTrigger>
                        <TabsTrigger value="whatsapp">
                            <Bot className="mr-2 h-4 w-4" /> WhatsApp
                        </TabsTrigger>
                        <TabsTrigger value="voice">
                             <Phone className="mr-2 h-4 w-4" /> Voice
                        </TabsTrigger>
                    </TabsList>
                </div>
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Message History</CardTitle>
                        <CardDescription>A log of all sent communications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Message ID</TableHead>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentMessages.map((message) => (
                                    <TableRow key={message.id}>
                                        <TableCell className="font-medium">{message.id}</TableCell>
                                        <TableCell>{message.recipient}</TableCell>
                                        <TableCell>{message.channel}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                message.status === 'Delivered' || message.status === 'Read' ? 'default' 
                                                : message.status === 'Sent' ? 'secondary' 
                                                : 'destructive'
                                            }>
                                                {message.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{message.date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Tabs>
        </main>
    )
}
