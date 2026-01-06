import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const transactions = [
    { name: "Liam Johnson", email: "liam@example.com", amount: "+₦25,000.00", type: "Tenement Rate", avatar: "https://picsum.photos/seed/1/40/40", fallback: "LJ" },
    { name: "Olivia Smith", email: "olivia@example.com", amount: "+₦5,000.00", type: "Business Permit", avatar: "https://picsum.photos/seed/2/40/40", fallback: "OS" },
    { name: "Noah Williams", email: "noah@example.com", amount: "+₦12,500.00", type: "Market Fee", avatar: "https://picsum.photos/seed/3/40/40", fallback: "NW" },
    { name: "Emma Brown", email: "emma@example.com", amount: "+₦50,000.00", type: "Hotel Permit", avatar: "https://picsum.photos/seed/4/40/40", fallback: "EB" },
    { name: "James Jones", email: "james@example.com", amount: "+₦3,000.00", type: "Vehicle Reg.", avatar: "https://picsum.photos/seed/5/40/40", fallback: "JJ" },
]

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          You have made {transactions.length} transactions this month.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8">
        {transactions.map((t, i) => (
            <div key={i} className="flex items-center gap-4">
            <Avatar className="hidden h-9 w-9 sm:flex" data-ai-hint="person face">
              <AvatarImage src={t.avatar} alt="Avatar" />
              <AvatarFallback>{t.fallback}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">{t.name}</p>
              <p className="text-sm text-muted-foreground">
                {t.email}
              </p>
            </div>
            <div className="ml-auto text-sm">
                <p className="font-medium">{t.amount}</p>
                <p className="text-xs text-muted-foreground text-right">{t.type}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
