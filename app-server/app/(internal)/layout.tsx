import { AppSidebar } from '@/components/main/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import {
  LayoutDashboardIcon,
  TableIcon,
  Building2Icon,
  WaypointsIcon,
  UsersIcon,
  ScrollIcon,
  BellIcon,
  UserIcon,
  LogOutIcon,
} from 'lucide-react';

const sidebarEntries = {
  mainEntries: [
    { label: 'Dashboard', icon: LayoutDashboardIcon, href: '/dashboard' },
    { label: 'Einreichungen', icon: TableIcon, href: '/filings' },
    { label: 'Unternehmensanalyse', icon: Building2Icon, href: '/company-analysis' },
    { label: 'Netzwerkanalyse', icon: WaypointsIcon, href: '/network-analysis' },
  ],
  adminEntries: [
    { label: 'Benutzerverwaltung', icon: UsersIcon, href: '/admin/users' },
    { label: 'Datafetcher-Logs', icon: ScrollIcon, href: '/admin/datafetcher' },
  ],
  footerEntries: [
    { label: 'Benachrichtigungen', icon: BellIcon, href: '/notifications' },
    { label: 'Konto verwalten', icon: UserIcon, href: '/account' },
    { label: 'Abmelden', icon: LogOutIcon, href: '/auth/logout' },
  ],
};

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <SidebarProvider>
      <AppSidebar entries={sidebarEntries} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
