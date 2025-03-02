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
import { SidebarEntry } from '@/components/main/sidebar-entry';
import { currentRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';

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

export async function AppSidebar({ entries, ...props }: AppSidebarProps) {
  const userRole = await currentRole();
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
          <SidebarGroup className="gap-2">
            {entries.mainEntries.map((entry) => (
              <SidebarEntry {...entry} key={entry.href} />
            ))}
          </SidebarGroup>

          {userRole === UserRole.admin && (
            <SidebarGroup className="gap-2">
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              {entries.adminEntries.map((entry) => (
                <SidebarEntry {...entry} key={entry.href} />
              ))}
            </SidebarGroup>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {entries.footerEntries &&
            entries.footerEntries.map((entry) => <SidebarEntry {...entry} key={entry.href} />)}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
