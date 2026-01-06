"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Home,
  LineChart,
  Menu,
  Package,
  CreditCard,
  Search,
  Users2,
  Bot,
  Settings,
  MessageSquare,
  Layers,
  Wallet,
  Bike,
  Wifi,
  HardDrive,
  Accessibility,
  LayoutGrid,
  Share2,
  Briefcase,
  DollarSign,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/theme-toggle"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const [isClient, setIsClient] = useState(false)
  const isMobile = useIsMobile()
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const handleShare = async () => {
    const url = window.location.href
    const title = document.title
    const text = "Check out this page from the STREAMS project!"

    if (isClient && isMobile && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
      } catch (error) {
        console.error("Error using Web Share API:", error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast({
          title: "URL Copied!",
          description: "The page URL has been copied to your clipboard.",
        })
      } catch (error) {
        console.error("Failed to copy URL:", error)
         toast({
          title: "Error",
          description: "Failed to copy URL to clipboard.",
          variant: "destructive"
        })
      }
    }
  }


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Package className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">STREAMS</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <CreditCard className="h-5 w-5" />
              Payments
            </Link>
            <Link
              href="/remita-payment"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <DollarSign className="h-5 w-5" />
              Remita Payments
            </Link>
            <Link
              href="/reports"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Package className="h-5 w-5" />
              Reports
            </Link>
            <Link
              href="/ai-tools"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Bot className="h-5 w-5" />
              AI Tools
            </Link>
            <Link
              href="/user-management"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Users2 className="h-5 w-5" />
              User Management
            </Link>
            <Link
              href="/analytics"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LineChart className="h-5 w-5" />
              Analytics
            </Link>
            <Link
              href="/gis"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Layers className="h-5 w-5" />
              GIS
            </Link>
            <Link
              href="/specialized-modules"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LayoutGrid className="h-5 w-5" />
              Specialized Modules
            </Link>
            <Link
              href="/financial-management"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Wallet className="h-5 w-5" />
              Financial Management
            </Link>
            <Link
              href="/messaging"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-5 w-5" />
              Messaging
            </Link>
            <Link
              href="/collection-optimization"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Bike className="h-5 w-5" />
              Collection Optimization
            </Link>
            <Link
              href="/collectors"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Briefcase className="h-5 w-5" />
              Collectors
            </Link>
            <Link
              href="/connectivity-solutions"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Wifi className="h-5 w-5" />
              Connectivity
            </Link>
            <Link
              href="/hardware-integration"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <HardDrive className="h-5 w-5" />
              Hardware
            </Link>
            <Link
              href="/accessibility"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Accessibility className="h-5 w-5" />
              Accessibility
            </Link>
            <Link
              href="#"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      {isClient && <Button variant="outline" size="icon" onClick={handleShare}>
        <Share2 className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Share</span>
      </Button>}
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
             <Avatar>
              <AvatarImage src="https://picsum.photos/seed/6/32/32" alt="User Avatar" data-ai-hint="person face" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Collector Portal</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/login">Login</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/signup">Sign Up</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
