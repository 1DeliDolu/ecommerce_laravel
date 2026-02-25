import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CreditCard,
    Gauge,
    LayoutGrid,
    MapPin,
    Package,
    Receipt,
    ShoppingBag,
    Trash2,
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
import type { Auth, NavItem } from '@/types';
import AppLogo from '@/components/app-logo';
import { dashboard, home } from '@/routes';
import { index as adminCategoriesIndex } from '@/routes/admin/categories';
import { index as adminOrdersIndex } from '@/routes/admin/orders';
import { index as adminOverviewIndex } from '@/routes/admin/overview';
import { trashed as adminProductImagesTrashed } from '@/routes/admin/product-images';
import { index as adminProductsIndex } from '@/routes/admin/products';

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
    { title: 'Overview', href: adminOverviewIndex(), icon: Gauge },
    { title: 'Categories', href: adminCategoriesIndex(), icon: Tags },
    { title: 'Products', href: adminProductsIndex(), icon: Package },
    { title: 'Orders', href: adminOrdersIndex(), icon: ShoppingBag },
    {
        title: 'Trashed Images',
        href: adminProductImagesTrashed(),
        icon: Trash2,
    },
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
    const { auth } = usePage<{ auth: Auth }>().props;
    const canAccessAdmin = auth?.can.access_admin === true;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={toUrl(home())}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain label="Platform" items={platformNavItems} />
                <NavMain label="Account" items={accountNavItems} />
                {canAccessAdmin && <NavMain label="Admin" items={adminNavItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
