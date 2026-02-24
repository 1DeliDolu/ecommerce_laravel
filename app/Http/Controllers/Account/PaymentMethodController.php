<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\PaymentMethodRequest;
use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $methods = $request->user()
            ->paymentMethods()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('account/payment-methods/index', [
            'paymentMethods' => $methods,
        ]);
    }

    public function store(PaymentMethodRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->safe()->except('card_number');

        // First card automatically becomes the default.
        if (! $user->paymentMethods()->exists()) {
            $data['is_default'] = true;
        }

        $user->paymentMethods()->create($data);

        return back()->with('success', 'Payment method added.');
    }

    public function update(PaymentMethodRequest $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $this->authorizeOwnership($request, $paymentMethod);

        $paymentMethod->update($request->safe()->except('card_number'));

        return back()->with('success', 'Payment method updated.');
    }

    public function destroy(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $this->authorizeOwnership($request, $paymentMethod);

        $paymentMethod->delete();

        // Promote the most recent remaining card to default.
        if ($paymentMethod->is_default) {
            $request->user()
                ->paymentMethods()
                ->latest()
                ->first()
                ?->update(['is_default' => true]);
        }

        return back()->with('success', 'Payment method removed.');
    }

    public function setDefault(Request $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $this->authorizeOwnership($request, $paymentMethod);

        $request->user()->paymentMethods()->update(['is_default' => false]);
        $paymentMethod->update(['is_default' => true]);

        return back()->with('success', 'Default payment method updated.');
    }

    private function authorizeOwnership(Request $request, PaymentMethod $paymentMethod): void
    {
        abort_unless($paymentMethod->user_id === $request->user()->id, 403);
    }
}
