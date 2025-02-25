import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { LucideIcon } from 'lucide-react';
import { SidebarEntry } from './sidebar-entry';

interface SidebarEntry {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface SidebarEntries {
  mainEntries: SidebarEntry[];
  adminEntries: SidebarEntry[];
  footerEntries: SidebarEntry[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  entries: SidebarEntries;
}

export function AppSidebar({ entries, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="pointer-events-none hover:bg-transparent">
            <SidebarMenuButton size="lg">
              <Image src="/logo_192.png" alt="Logo" width={32} height={32} />
              <h1 className="text-xl font-semibold">SECInsiderMonitor</h1>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup>
            {entries.mainEntries.map((entry) => (
              <SidebarEntry {...entry} />
            ))}
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            {entries.adminEntries.map((entry) => (
              <SidebarEntry {...entry} />
            ))}
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {entries.footerEntries &&
            entries.footerEntries.map((entry) => <SidebarEntry {...entry} />)}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
