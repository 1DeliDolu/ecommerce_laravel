import { type PropsWithChildren } from 'react';

import FlashMessages from '@/components/flash-messages';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <FlashMessages className="px-4 pt-4" />
            {children}
        </AppSidebarLayout>
    );
}
