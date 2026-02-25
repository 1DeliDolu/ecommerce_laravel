<?php

namespace App\Http\Controllers;

use App\Data\PricingContext;
use App\Services\Dashboard\AdminDashboardMetricsService;
use App\Services\Pricing\TierPricingService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(
        Request $request,
        AdminDashboardMetricsService $metricsService,
        TierPricingService $tierPricingService,
    ): Response {
        $user = $request->user();

        if ($user?->can('access-admin')) {
            $range = (string) $request->query('range', '90d');
            $granularity = (string) $request->query('granularity', 'month');
            $metrics = $metricsService->build(
                range: $range,
                granularity: $granularity,
                now: CarbonImmutable::now(),
            );

            $pricingPreview = $tierPricingService->evaluate(
                PricingContext::fromUser(
                    user: $user,
                    cartSnapshot: [],
                    subtotalCents: 10000,
                ),
            );

            return Inertia::render('admin/dashboard/index', [
                'metrics' => $metrics,
                'pricing_preview' => $pricingPreview,
            ]);
        }

        return Inertia::render('dashboard');
    }
}
