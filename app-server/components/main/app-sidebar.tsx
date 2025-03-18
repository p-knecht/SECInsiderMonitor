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
import { SidebarEntry, SidebarEntryProps } from '@/components/main/sidebar-entry';
import { UserRole } from '@prisma/client';
import { auth } from '@/auth';

/**
 * Defines the sidebar entries for the main, admin, and footer sections.
 */
interface SidebarSections {
  mainEntries: SidebarEntryProps[];
  adminEntries: SidebarEntryProps[];
  footerEntries: SidebarEntryProps[];
}

/**
 * Defines the properties for the AppSidebar component containing the sidebar entries grouped by main, admin, and footer sections.
 */
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  entries: SidebarSections;
}

/**
 * Render the AppSidebar component with the grouped sidebar entries. (Entries in admin section/group are only shown for admin users.)
 *
 * @param {AppSidebarProps} { entries, ...props } - The AppSidebar properties containing the sidebar entries grouped by main, admin, and footer sections.
 * @returns {JSX.Element} - The renderer AppSidebar component.
 */
export async function AppSidebar({ entries, ...props }: AppSidebarProps) {
  const userRole = (await auth())?.user?.role;
  return (
    <Sidebar collapsible="icon" {...props} className="z-50">
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
