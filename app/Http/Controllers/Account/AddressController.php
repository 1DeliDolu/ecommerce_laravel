<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\AddressRequest;
use App\Models\UserAddress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    public function index(Request $request): Response
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('account/addresses/index', [
            'addresses' => $addresses,
        ]);
    }

    public function store(AddressRequest $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (! $user->addresses()->exists()) {
            $data['is_default'] = true;
        }

        $user->addresses()->create($data);

        return back()->with('success', 'Address saved.');
    }

    public function update(AddressRequest $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeOwnership($request, $address);

        $address->update($request->validated());

        return back()->with('success', 'Address updated.');
    }

    public function destroy(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeOwnership($request, $address);

        $address->delete();

        if ($address->is_default) {
            $request->user()
                ->addresses()
                ->latest()
                ->first()
                ?->update(['is_default' => true]);
        }

        return back()->with('success', 'Address removed.');
    }

    public function setDefault(Request $request, UserAddress $address): RedirectResponse
    {
        $this->authorizeOwnership($request, $address);

        $request->user()->addresses()->update(['is_default' => false]);
        $address->update(['is_default' => true]);

        return back()->with('success', 'Default address updated.');
    }

    private function authorizeOwnership(Request $request, UserAddress $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 403);
    }
}
