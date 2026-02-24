import type { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type BaseChartProps = {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    className?: string;
    headerClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
};

export default function BaseChart({
    title,
    description,
    children,
    actions,
    footer,
    className,
    headerClassName,
    titleClassName,
    descriptionClassName,
    contentClassName,
    footerClassName,
}: BaseChartProps) {
    return (
        <Card className={cn('pt-0', className)}>
            <CardHeader
                className={cn(
                    'flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row',
                    headerClassName,
                )}
            >
                <div className="grid flex-1 gap-1">
                    <CardTitle className={cn('text-base', titleClassName)}>
                        {title}
                    </CardTitle>
                    {description ? (
                        <CardDescription className={descriptionClassName}>
                            {description}
                        </CardDescription>
                    ) : null}
                </div>
                {actions ? <div className="sm:ml-auto">{actions}</div> : null}
            </CardHeader>
            <CardContent
                className={cn('px-2 pt-4 sm:px-6 sm:pt-6', contentClassName)}
            >
                {children}
            </CardContent>
            {footer ? (
                <div
                    className={cn(
                        'px-6 pb-6 text-xs text-muted-foreground',
                        footerClassName,
                    )}
                >
                    {footer}
                </div>
            ) : null}
        </Card>
    );
}
