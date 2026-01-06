import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const recentPayments = [
    { id: 'PAY-1234', amount: '₦25,000', status: 'Paid', date: '2024-05-20', type: 'Tenement Rate' },
    { id: 'PAY-1235', amount: '₦5,000', status: 'Pending', date: '2024-05-19', type: 'Business Permit' },
    { id: 'PAY-1236', amount: '₦12,000', status: 'Paid', date: '2024-05-18', type: 'Market Fees' },
    { id: 'PAY-1237', amount: '₦7,500', status: 'Failed', date: '2024-05-17', type: 'Signpost' },
    { id: 'PAY-1238', amount: '₦3,000', status: 'Paid', date: '2024-05-16', type: 'Vehicle Reg.' },
    { id: 'PAY-1239', amount: '₦50,000', status: 'Paid', date: '2024-05-15', type: 'Hotel Permit' },
]

export default function PaymentsPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                <div className="flex items-center gap-2">
                     <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Payment
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>A list of all recorded payments across various revenue streams.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.id}</TableCell>
                                    <TableCell>{payment.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            payment.status === 'Paid' ? 'default' : payment.status === 'Pending' ? 'secondary' : 'destructive'
                                        }>
                                            {payment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{payment.date}</TableCell>
                                    <TableCell className="text-right">{payment.amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    )
}
