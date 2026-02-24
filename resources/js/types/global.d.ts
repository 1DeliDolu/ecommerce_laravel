import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth & { is_admin: boolean };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
