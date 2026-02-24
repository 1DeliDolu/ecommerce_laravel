<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentMethodRequest;
use App\Http\Requests\UpdatePaymentMethodRequest;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    private ?bool $usesLegacyColumns = null;

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PaymentMethod::class);

        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $paymentMethods = $user
            ->paymentMethods()
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (PaymentMethod $paymentMethod): array => [
                'id' => $paymentMethod->id,
                'label' => $this->usesLegacyColumns() ? null : $paymentMethod->label,
                'card_holder_name' => $this->usesLegacyColumns()
                    ? (string) $paymentMethod->cardholder_name
                    : (string) $paymentMethod->card_holder_name,
                'brand' => $paymentMethod->brand,
                'last_four' => $this->usesLegacyColumns()
                    ? (string) $paymentMethod->last4
                    : (string) $paymentMethod->last_four,
                'expiry_month' => $this->usesLegacyColumns()
                    ? (int) $paymentMethod->exp_month
                    : (int) $paymentMethod->expiry_month,
                'expiry_year' => $this->usesLegacyColumns()
                    ? (int) $paymentMethod->exp_year
                    : (int) $paymentMethod->expiry_year,
                'is_default' => $paymentMethod->is_default,
            ])
            ->values();

        return Inertia::render('account/payment-methods/index', [
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function store(StorePaymentMethodRequest $request): RedirectResponse
    {
        Gate::authorize('create', PaymentMethod::class);

        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $validated = $request->validated();
        $cardNumber = $validated['card_number'];
        $attributes = $this->buildStoreAttributes($validated, $cardNumber);

        DB::transaction(function () use ($user, $validated, $attributes): void {
            $shouldBeDefault = (bool) ($validated['is_default'] ?? false)
                || ! $user->paymentMethods()->exists();

            if ($shouldBeDefault) {
                $user->paymentMethods()->update(['is_default' => false]);
            }

            $user->paymentMethods()->create([
                ...$attributes,
                'is_default' => $shouldBeDefault,
            ]);
        });

        return to_route('account.payment-methods.index')
            ->with('success', 'Payment method saved.');
    }

    public function update(UpdatePaymentMethodRequest $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        Gate::authorize('update', $paymentMethod);

        $validated = $request->validated();
        $payload = $this->buildUpdateAttributes($validated);

        $cardNumber = $validated['card_number'] ?? null;

        if (is_string($cardNumber) && $cardNumber !== '') {
            if ($this->usesLegacyColumns()) {
                $payload['brand'] = $this->detectBrand($cardNumber);
                $payload['last4'] = substr($cardNumber, -4);
            } else {
                $payload['brand'] = $this->detectBrand($cardNumber);
                $payload['last_four'] = substr($cardNumber, -4);
            }
        }

        DB::transaction(function () use ($paymentMethod, $validated, $payload): void {
            $shouldBeDefault = (bool) ($validated['is_default'] ?? false);

            if ($shouldBeDefault) {
                PaymentMethod::query()
                    ->where('user_id', $paymentMethod->user_id)
                    ->where('id', '!=', $paymentMethod->id)
                    ->update(['is_default' => false]);
            }

            if (! $shouldBeDefault && $paymentMethod->is_default) {
                $fallbackPaymentMethod = PaymentMethod::query()
                    ->where('user_id', $paymentMethod->user_id)
                    ->where('id', '!=', $paymentMethod->id)
                    ->orderByDesc('updated_at')
                    ->first();

                if ($fallbackPaymentMethod === null) {
                    $shouldBeDefault = true;
                } else {
                    $fallbackPaymentMethod->update(['is_default' => true]);
                }
            }

            $paymentMethod->update([
                ...$payload,
                'is_default' => $shouldBeDefault,
            ]);
        });

        return to_route('account.payment-methods.index')
            ->with('success', 'Payment method updated.');
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        Gate::authorize('delete', $paymentMethod);

        DB::transaction(function () use ($paymentMethod): void {
            $userId = $paymentMethod->user_id;
            $wasDefault = $paymentMethod->is_default;

            $paymentMethod->delete();

            if (! $wasDefault) {
                return;
            }

            $fallbackPaymentMethod = PaymentMethod::query()
                ->where('user_id', $userId)
                ->orderByDesc('updated_at')
                ->first();

            if ($fallbackPaymentMethod === null) {
                return;
            }

            $fallbackPaymentMethod->update(['is_default' => true]);
        });

        return to_route('account.payment-methods.index')
            ->with('success', 'Payment method removed.');
    }

    public function setDefault(PaymentMethod $paymentMethod): RedirectResponse
    {
        Gate::authorize('update', $paymentMethod);

        DB::transaction(function () use ($paymentMethod): void {
            PaymentMethod::query()
                ->where('user_id', $paymentMethod->user_id)
                ->update(['is_default' => false]);

            $paymentMethod->update(['is_default' => true]);
        });

        return to_route('account.payment-methods.index')
            ->with('success', 'Default payment method updated.');
    }

    private function detectBrand(string $cardNumber): string
    {
        if (preg_match('/^4\d{15}$/', $cardNumber) === 1) {
            return 'Visa';
        }

        if (preg_match('/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/', $cardNumber) === 1) {
            return 'Mastercard';
        }

        if (preg_match('/^3[47]\d{13}$/', $cardNumber) === 1) {
            return 'Amex';
        }

        if (preg_match('/^9792\d{12}$/', $cardNumber) === 1) {
            return 'Troy';
        }

        return 'Card';
    }

    private function usesLegacyColumns(): bool
    {
        if ($this->usesLegacyColumns !== null) {
            return $this->usesLegacyColumns;
        }

        $this->usesLegacyColumns = Schema::hasColumn('payment_methods', 'cardholder_name');

        return $this->usesLegacyColumns;
    }

    private function buildStoreAttributes(array $validated, string $cardNumber): array
    {
        if ($this->usesLegacyColumns()) {
            return [
                'cardholder_name' => $validated['card_holder_name'],
                'brand' => $this->detectBrand($cardNumber),
                'last4' => substr($cardNumber, -4),
                'exp_month' => $validated['expiry_month'],
                'exp_year' => $validated['expiry_year'],
            ];
        }

        return [
            'label' => $validated['label'] ?? null,
            'card_holder_name' => $validated['card_holder_name'],
            'brand' => $this->detectBrand($cardNumber),
            'last_four' => substr($cardNumber, -4),
            'expiry_month' => $validated['expiry_month'],
            'expiry_year' => $validated['expiry_year'],
        ];
    }

    private function buildUpdateAttributes(array $validated): array
    {
        if ($this->usesLegacyColumns()) {
            return [
                'cardholder_name' => $validated['card_holder_name'],
                'exp_month' => $validated['expiry_month'],
                'exp_year' => $validated['expiry_year'],
            ];
        }

        return [
            'label' => $validated['label'] ?? null,
            'card_holder_name' => $validated['card_holder_name'],
            'expiry_month' => $validated['expiry_month'],
            'expiry_year' => $validated['expiry_year'],
        ];
    }
}
