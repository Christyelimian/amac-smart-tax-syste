import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Percent } from "lucide-react"
import { Button } from "../ui/button"
import type { RevenueSource } from "@/lib/revenue-data"


const MOCK_DATA = {
    'tenement-rate-1': {
        collectors: [
            { name: "Adebayo John", id: "COL-007", zone: "Ward 2", compliance: 78, collections: 1950000, avatar: "https://picsum.photos/seed/20/40/40", fallback: "AJ" },
            { name: "Chioma Nwosu", id: "COL-003", zone: "Ward 1", compliance: 65, collections: 1100000, avatar: "https://picsum.photos/seed/21/40/40", fallback: "CN" },
        ],
        kpis: [
            { zone: "Ward 2", collected: 1950000, target: 2500000 },
            { zone: "Ward 1", collected: 1100000, target: 1500000 },
        ],
        contract: { revenueShare: 30, slaCompliance: 98, totalCollected: 3050000 }
    },
    'shops-a': {
        collectors: [
            { name: "Musa Ibrahim", id: "COL-012", zone: "Zone A", compliance: 95, collections: 2200000, avatar: "https://picsum.photos/seed/22/40/40", fallback: "MI" },
            { name: "Tunde Adeboye", id: "COL-015", zone: "Zone A", compliance: 88, collections: 1800000, avatar: "https://picsum.photos/seed/23/40/40", fallback: "TA" },
        ],
        kpis: [
             { zone: "Zone A", collected: 4000000, target: 5000000 },
        ],
        contract: { revenueShare: 25, slaCompliance: 95, totalCollected: 4000000 }
    }
}

export function CompanyDashboard({ contractor }: { contractor?: RevenueSource }) {
    
    if (!contractor) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>No Contractor Selected</CardTitle>
                    <CardDescription>Please select a contractor company from the dropdown to view their dashboard.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    const data = MOCK_DATA[contractor.value as keyof typeof MOCK_DATA] || MOCK_DATA['tenement-rate-1']

    const {name, collectors, kpis, contract} = {
        name: contractor.company,
        ...data
    };
    const commission = (contract.totalCollected * (contract.revenueShare / 100));

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Collectors Assigned to {name}</CardTitle>
                    <CardDescription>Performance overview of all collectors for {contractor.label}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Collector</TableHead>
                                <TableHead>Assigned Zone</TableHead>
                                <TableHead>Compliance Rate</TableHead>
                                <TableHead className="text-right">Total Collected ₦</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collectors.map((collector) => (
                                <TableRow key={collector.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9" data-ai-hint="person face">
                                              <AvatarImage src={collector.avatar} alt="Avatar" />
                                              <AvatarFallback>{collector.fallback}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                 <p className="font-semibold">{collector.name}</p>
                                                 <p className="text-sm text-muted-foreground">{collector.id}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{collector.zone}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={collector.compliance} className="w-24 h-2" />
                                            <span>{collector.compliance}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{collector.collections.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                 <Card>
                    <CardHeader>
                        <CardTitle>KPI Breakdown by Zone</CardTitle>
                    </CardHeader>
                     <CardContent className="grid gap-4">
                        {kpis.map(kpi => (
                             <div key={kpi.zone} className="space-y-2">
                                <div className="flex justify-between items-center"><span className="font-medium">{kpi.zone}</span><span className="text-muted-foreground">₦{kpi.collected.toLocaleString()} / ₦{kpi.target.toLocaleString()}</span></div>
                                <Progress value={kpi.collected / kpi.target * 100}/>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Contract Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Percent className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">Revenue Share</span>
                            </div>
                            <span className="font-bold text-lg">{contract.revenueShare}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                           <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">SLA Compliance</span>
                            </div>
                             <span className="font-bold text-lg text-green-600">{contract.slaCompliance}%</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Commission Calculator</CardTitle>
                        <CardDescription>Estimate company commission.</CardDescription>
                    </CardHeader>
                     <CardContent className="grid gap-4">
                        <div>
                            <Label htmlFor="total-collected">Total Revenue Collected (₦)</Label>
                            <Input id="total-collected" defaultValue={contract.totalCollected.toLocaleString()} />
                        </div>
                         <div>
                            <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                            <Input id="commission-rate" defaultValue={contract.revenueShare} />
                        </div>
                        <Button>Calculate Commission</Button>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Estimated Commission</p>
                            <p className="text-2xl font-bold">₦{commission.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
