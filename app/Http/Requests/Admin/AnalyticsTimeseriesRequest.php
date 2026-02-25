<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AnalyticsTimeseriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'scope' => ['required', 'string', Rule::in(['overall', 'category', 'product'])],
            'scope_id' => [
                Rule::requiredIf(fn (): bool => in_array((string) $this->input('scope'), ['category', 'product'], true)),
                'nullable',
                'integer',
                'min:1',
            ],
            'metric' => ['required', 'string', Rule::in(['revenue', 'units', 'orders'])],
            'granularity' => ['required', 'string', Rule::in(['day', 'week', 'month', 'season', 'year'])],
            'range' => ['required', 'string', Rule::in(['7d', '15d', '30d', '60d', '90d', '180d', '360d'])],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $scope = (string) $this->input('scope');
            $scopeId = $this->input('scope_id');

            if (! in_array($scope, ['category', 'product'], true)) {
                return;
            }

            if ($scopeId === null || $scopeId === '') {
                return;
            }

            $resolvedScopeId = (int) $scopeId;

            if ($scope === 'category' && ! Category::query()->whereKey($resolvedScopeId)->exists()) {
                $validator->errors()->add('scope_id', 'The selected category is invalid.');
            }

            if ($scope === 'product' && ! Product::query()->whereKey($resolvedScopeId)->exists()) {
                $validator->errors()->add('scope_id', 'The selected product is invalid.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'scope.required' => 'Please choose a data scope.',
            'scope.in' => 'The selected data scope is invalid.',
            'scope_id.required' => 'Please choose a category or product.',
            'metric.required' => 'Please choose a metric.',
            'metric.in' => 'The selected metric is invalid.',
            'granularity.required' => 'Please choose a granularity.',
            'granularity.in' => 'The selected granularity is invalid.',
            'range.required' => 'Please choose a date range.',
            'range.in' => 'The selected date range is invalid.',
        ];
    }
}
