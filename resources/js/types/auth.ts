export type User = {
    id: number;
    name: string;
    email: string;
    tier?: 'platinum' | 'gold' | 'silver' | 'bronze' | null;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type DefaultAddress = {
    id: number;
    label: string | null;
    first_name: string;
    last_name: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postal_code: string;
    country: string;
    is_default: boolean;
};

export type DefaultPaymentMethod = {
    id: number;
    label: string | null;
    card_holder_name: string;
    brand: string;
    last_four: string;
    expiry_month: number;
    expiry_year: number;
    is_default: boolean;
};

export type Auth = {
    user: User;
    default_address?: DefaultAddress | null;
    default_payment_method?: DefaultPaymentMethod | null;
    can: {
        access_admin: boolean;
    };
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
