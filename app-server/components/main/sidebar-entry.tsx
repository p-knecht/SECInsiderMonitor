import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface SidebarEntryProps {
  label: string;
  icon: LucideIcon;
  href: string;
}

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
