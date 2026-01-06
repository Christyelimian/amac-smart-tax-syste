import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, MoreHorizontal } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const users = [
    {
        name: "Admin User",
        email: "admin@streams.gov",
        role: "Admin",
        status: "Active",
        avatar: "https://picsum.photos/seed/10/40/40",
        fallback: "AU"
    },
    {
        name: "Field Collector",
        email: "collector@streams.gov",
        role: "Collector",
        status: "Active",
        avatar: "https://picsum.photos/seed/11/40/40",
        fallback: "FC"
    },
    {
        name: "Finance Officer",
        email: "finance@streams.gov",
        role: "Finance",
        status: "Active",
        avatar: "https://picsum.photos/seed/12/40/40",
        fallback: "FO"
    },
    {
        name: "Support Staff",
        email: "support@streams.gov",
        role: "Support",
        status: "Inactive",
        avatar: "https://picsum.photos/seed/13/40/40",
        fallback: "SS"
    },
     {
        name: "John Doe",
        email: "john.d@example.com",
        role: "Collector",
        status: "Active",
        avatar: "https://picsum.photos/seed/14/40/40",
        fallback: "JD"
    },
]

export default function UserManagementPage() {
    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <div className="flex items-center gap-2">
                     <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage your team members and their account permissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9" data-ai-hint="person face">
                                              <AvatarImage src={user.avatar} alt="Avatar" />
                                              <AvatarFallback>{user.fallback}</AvatarFallback>
                                            </Avatar>
                                            <div className="grid gap-0.5">
                                                 <p className="font-semibold">{user.name}</p>
                                                 <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Deactivate</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
    )
}
