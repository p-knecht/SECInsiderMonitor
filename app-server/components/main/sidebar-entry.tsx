import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

/**
 * Defines the properties for the SidebarEntry component containing the label, icon, and href.
 */
export interface SidebarEntryProps {
  label: string;
  icon: LucideIcon;
  href: string;
}

/**
 * Renders a sidebar entry component with a label, icon, and href.
 * @param {SidebarEntryProps} { label, icon, href } - The sidebar entry properties containing the label, icon, and href.
 * @returns {JSX.Element} - The renderer SidebarEntry component.
 */
export function SidebarEntry({ label, icon: Icon, href }: SidebarEntryProps) {
  return (
    <SidebarMenuItem>
      <Link href={href}>
        <SidebarMenuButton tooltip={label} className="cursor-pointer">
          <Icon />
          {label}
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}
