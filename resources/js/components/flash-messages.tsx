import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type Flash = {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
};

type Props = {
    className?: string;
};

export default function FlashMessages({ className = '' }: Props) {
    const props = usePage().props as unknown as { flash?: Flash };
    const flash = props.flash;

    const messages = useMemo(() => {
        if (!flash) return [];

        const items: { type: keyof Flash; text: string }[] = [];
        (['success', 'error', 'warning', 'info'] as const).forEach((k) => {
            const v = flash[k];
            if (typeof v === 'string' && v.trim() !== '') {
                items.push({ type: k, text: v });
            }
        });

        return items;
    }, [flash]);

    const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // new flash => reset dismiss state
        setDismissed({});
    }, [flash?.success, flash?.error, flash?.warning, flash?.info]);

    if (messages.length === 0) return null;

    const styles: Record<string, string> = {
        success:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
        warning:
            'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
        info: 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100',
    };

    const titles: Record<string, string> = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
    };

    return (
        <div className={className}>
            <div className="space-y-2">
                {messages.map((m, idx) => {
                    const key = `${m.type}-${idx}`;
                    if (dismissed[key]) return null;

                    const isError = m.type === 'error';

                    return (
                        <Alert
                            key={key}
                            variant={isError ? 'destructive' : undefined}
                            className={!isError ? styles[m.type] : undefined}
                        >
                            <div className="flex w-full items-start justify-between gap-3">
                                <div>
                                    <AlertTitle>{titles[m.type]}</AlertTitle>
                                    <AlertDescription className="whitespace-pre-wrap">
                                        {m.text}
                                    </AlertDescription>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        setDismissed((prev) => ({
                                            ...prev,
                                            [key]: true,
                                        }))
                                    }
                                    aria-label="Dismiss"
                                    className="h-8 w-8"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </Alert>
                    );
                })}
            </div>
        </div>
    );
}
