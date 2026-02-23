import { Link } from '@inertiajs/react';
import {
    BookOpen,
    CreditCard,
    Gauge,
    LayoutGrid,
    MapPin,
    Package,
    Receipt,
    ShoppingBag,
    Tags,
    Folder,
} from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';
import AppLogo from '@/components/app-logo';
import { dashboard } from '@/routes';

const platformNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
];

const accountNavItems: NavItem[] = [
    { title: 'Orders', href: '/account/orders', icon: Receipt },
    { title: 'Addresses', href: '/account/addresses', icon: MapPin },
    {
        title: 'Payment Methods',
        href: '/account/payment-methods',
        icon: CreditCard,
    },
];

const adminNavItems: NavItem[] = [
    { title: 'Overview', href: '/admin/overview', icon: Gauge },
    { title: 'Categories', href: '/admin/categories', icon: Tags },
    { title: 'Products', href: '/admin/products', icon: Package },
    { title: 'Orders', href: '/admin/orders', icon: ShoppingBag },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={toUrl(dashboard())}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain label="Platform" items={platformNavItems} />
                <NavMain label="Account" items={accountNavItems} />
                <NavMain label="Admin" items={adminNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
