<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AnalyticsCategoryProductsRequest;
use App\Http\Requests\Admin\AnalyticsTimeseriesRequest;
use App\Services\Dashboard\AdminAnalyticsService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function bootstrap(AdminAnalyticsService $analyticsService): JsonResponse
    {
        return response()->json(
            $analyticsService->bootstrap(CarbonImmutable::now()),
        );
    }

    public function categoryProducts(
        AnalyticsCategoryProductsRequest $request,
        AdminAnalyticsService $analyticsService,
    ): JsonResponse {
        $categoryId = $request->validated('category_id');

        return response()->json([
            'products' => $analyticsService->productsForCategory(
                categoryId: $categoryId !== null ? (int) $categoryId : null,
            ),
        ]);
    }

    public function timeseries(
        AnalyticsTimeseriesRequest $request,
        AdminAnalyticsService $analyticsService,
    ): JsonResponse {
        $validated = $request->validated();

        return response()->json(
            $analyticsService->timeseries(
                scope: (string) $validated['scope'],
                scopeId: isset($validated['scope_id']) ? (int) $validated['scope_id'] : null,
                metric: (string) $validated['metric'],
                granularity: (string) $validated['granularity'],
                range: (string) $validated['range'],
                now: CarbonImmutable::now(),
            ),
        );
    }
}
