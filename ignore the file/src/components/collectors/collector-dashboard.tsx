import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, CloudCog, Percent, QrCode, Shield, ShieldAlert, Target, Wallet, XCircle } from "lucide-react"

const drilldownData = [
    { zone: "Ward 2", module: "Property Tax", target: 1200000, collected: 900000, visits: "8/10", issues: { text: "1 flagged", status: "warning" } },
    { zone: "Ward 3", module: "Market Fees", target: 600000, collected: 610000, visits: "5/5", issues: { text: "No issues", status: "success" } },
    { zone: "Ward 5", module: "Hotel Permits", target: 800000, collected: 400000, visits: "2/5", issues: { text: "Critical", status: "error" } },
    { zone: "Ward 1", module: "Vehicle Reg", target: 500000, collected: 450000, visits: "12/15", issues: { text: "No issues", status: "success" } },
    { zone: "Ward 4", module: "Shop and Kiosk", target: 1000000, collected: 850000, visits: "20/22", issues: { text: "2 flagged", status: "warning" } },
]

const collectorTools = [
    { title: "Geo-fenced Receipt Issuance", description: "Must be in assigned zone to issue.", icon: Shield },
    { title: "QR Verification", description: "Validate taxpayer or stall IDs instantly.", icon: QrCode },
    { title: "Offline Collection Mode", description: "Syncs automatically when online.", icon: CloudCog },
    { title: "Report Fraud Button", description: "Send location, snapshot & details.", icon: ShieldAlert },
]

export function CollectorDashboard() {
    return (
        <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border" data-ai-hint="person face">
                                <AvatarImage src="https://picsum.photos/seed/7/64/64" />
                                <AvatarFallback>AJ</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle>Adebayo John</CardTitle>
                                <CardDescription>ID: COL-007 | Field Agent</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                        <p><strong>Zone Assigned:</strong> Ward 2, Ward 3, Ward 5</p>
                        <p><strong>Revenue Modules:</strong> Property Tax, Market Fees, Hotel Permits</p>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly Performance Summary</CardTitle>
                        <CardDescription>Overview of collection targets and achievements.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2 p-4 border rounded-lg">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-5 w-5" />
                                <span className="font-semibold">Target vs Actual</span>
                            </div>
                            <p className="text-2xl font-bold">₦1,910,000 / ₦2,600,000</p>
                            <Progress value={(1910000 / 2600000) * 100} className="h-2" />
                        </div>
                        <div className="flex flex-col gap-2 p-4 border rounded-lg">
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Percent className="h-5 w-5" />
                                <span className="font-semibold">Compliance Rate</span>
                            </div>
                            <p className="text-2xl font-bold">73%</p>
                        </div>
                        <div className="flex flex-col gap-2 p-4 border rounded-lg">
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Wallet className="h-5 w-5" />
                                <span className="font-semibold">Commissions Earned</span>
                            </div>
                             <p className="text-2xl font-bold">₦95,500</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Zone & Revenue Drilldown</CardTitle>
                    <CardDescription>Detailed breakdown of collection activities by zone and revenue module.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Zone</TableHead>
                                <TableHead>Module</TableHead>
                                <TableHead className="text-right">Target ₦</TableHead>
                                <TableHead className="text-right">Collected ₦</TableHead>
                                <TableHead className="text-right">%</TableHead>
                                <TableHead>Visits</TableHead>
                                <TableHead>Issues</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drilldownData.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{row.zone}</TableCell>
                                    <TableCell>{row.module}</TableCell>
                                    <TableCell className="text-right">{row.target.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{row.collected.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-semibold">{Math.round(row.collected / row.target * 100)}%</TableCell>
                                    <TableCell>{row.visits}</TableCell>
                                    <TableCell>
                                        <Badge variant={row.issues.status === 'error' ? 'destructive' : row.issues.status === 'success' ? 'default' : 'secondary'}>
                                            {row.issues.status === 'success' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                            {row.issues.status === 'error' && <XCircle className="mr-1 h-3 w-3" />}
                                            {row.issues.text}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>GIS Zone Coverage</CardTitle>
                        <CardDescription>Visual map of collection status and issues.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video w-full rounded-md overflow-hidden border">
                           <Image src="https://picsum.photos/seed/8/1200/600" width={1200} height={600} alt="GIS Map" className="w-full h-full object-cover" data-ai-hint="map city" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Collector Tools</CardTitle>
                        <CardDescription>Quick access to field collection tools.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {collectorTools.map((tool, index) => (
                             <div key={index} className="flex items-start gap-4 p-3 border rounded-lg">
                                <tool.icon className="h-6 w-6 mt-1 text-primary" />
                                <div>
                                    <h4 className="font-semibold">{tool.title}</h4>
                                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
