'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LineChart,
  Package,
  CreditCard,
  Users2,
  Settings,
  Bot,
  Landmark,
  MessageSquare,
  Layers,
  Wallet,
  Bike,
  Wifi,
  HardDrive,
  Accessibility,
  LayoutGrid,
  Briefcase,
  DollarSign,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const AppSidebar = () => {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem className="mb-4">
             <SidebarMenuButton asChild className="h-12 w-12 bg-primary text-primary-foreground justify-center hover:bg-primary/90 hover:text-primary-foreground">
                <Link href="/">
                    <Landmark className="h-6 w-6" />
                    <span className="sr-only">STREAMS</span>
                </Link>
             </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard" isActive={pathname === '/'}>
              <Link href="/">
                <Home />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Payments" isActive={pathname.startsWith('/payments')}>
              <Link href="/payments">
                <CreditCard />
                <span>Payments</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Remita Payments" isActive={pathname.startsWith('/remita-payment')}>
              <Link href="/remita-payment">
                <DollarSign />
                <span>Remita Payments</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Reports" isActive={pathname.startsWith('/reports')}>
              <Link href="/reports">
                <Package />
                <span>Reports</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="AI Tools" isActive={pathname.startsWith('/ai-tools') || pathname.startsWith('/advanced-analytics')}>
              <Link href="/ai-tools">
                <Bot />
                <span>AI Tools</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="User Management" isActive={pathname.startsWith('/user-management')}>
              <Link href="/user-management">
                <Users2 />
                <span>User Management</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Analytics" isActive={pathname.startsWith('/analytics')}>
              <Link href="/analytics">
                <LineChart />
                <span>Analytics</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="GIS" isActive={pathname.startsWith('/gis')}>
              <Link href="/gis">
                <Layers />
                <span>GIS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Specialized Modules" isActive={pathname.startsWith('/specialized-modules')}>
              <Link href="/specialized-modules">
                <LayoutGrid />
                <span>Specialized Modules</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Financial Management" isActive={pathname.startsWith('/financial-management')}>
              <Link href="/financial-management">
                <Wallet />
                <span>Financial Management</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Messaging" isActive={pathname.startsWith('/messaging')}>
              <Link href="/messaging">
                <MessageSquare />
                <span>Messaging</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Collection Optimization" isActive={pathname.startsWith('/collection-optimization')}>
              <Link href="/collection-optimization">
                <Bike />
                <span>Collection Optimization</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Collectors" isActive={pathname.startsWith('/collectors')}>
              <Link href="/collectors">
                <Briefcase />
                <span>Collectors</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Connectivity" isActive={pathname.startsWith('/connectivity-solutions')}>
              <Link href="/connectivity-solutions">
                <Wifi />
                <span>Connectivity</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Hardware" isActive={pathname.startsWith('/hardware-integration')}>
              <Link href="/hardware-integration">
                <HardDrive />
                <span>Hardware</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Accessibility" isActive={pathname.startsWith('/accessibility')}>
              <Link href="/accessibility">
                <Accessibility />
                <span>Accessibility</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
