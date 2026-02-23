import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({
    label = 'Platform',
    items = [],
}: {
    label?: string;
    items: NavItem[];
}) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{label}</SidebarGroupLabel>

            <SidebarMenu>
                {items.map((item) => {
                    const isActive = item.isActive ?? isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem
                            key={`${label}-${item.title}-${toUrl(item.href)}`}
                        >
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={item.title}
                            >
                                <Link href={toUrl(item.href)}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
