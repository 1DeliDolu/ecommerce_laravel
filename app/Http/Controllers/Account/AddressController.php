<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Models\Address;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Address::class);

        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $addresses = $user
            ->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Address $address): array => [
                'id' => $address->id,
                'label' => $address->label,
                'first_name' => $address->first_name,
                'last_name' => $address->last_name,
                'phone' => $address->phone,
                'line1' => $address->line1,
                'line2' => $address->line2,
                'city' => $address->city,
                'state' => $address->state,
                'postal_code' => $address->postal_code,
                'country' => $address->country,
                'is_default' => $address->is_default,
            ])
            ->values();

        return Inertia::render('account/addresses/index', [
            'addresses' => $addresses,
        ]);
    }

    public function store(StoreAddressRequest $request): RedirectResponse
    {
        Gate::authorize('create', Address::class);

        $user = $request->user();

        if (! $user instanceof User) {
            abort(403);
        }

        $payload = $request->validated();

        DB::transaction(function () use ($user, $payload): void {
            $shouldBeDefault = (bool) ($payload['is_default'] ?? false)
                || ! $user->addresses()->exists();

            if ($shouldBeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            $user->addresses()->create([
                ...$payload,
                'is_default' => $shouldBeDefault,
            ]);
        });

        return to_route('account.addresses.index')
            ->with('success', 'Address saved.');
    }

    public function update(UpdateAddressRequest $request, Address $address): RedirectResponse
    {
        Gate::authorize('update', $address);

        $payload = $request->validated();

        DB::transaction(function () use ($address, $payload): void {
            $shouldBeDefault = (bool) ($payload['is_default'] ?? false);

            if ($shouldBeDefault) {
                Address::query()
                    ->where('user_id', $address->user_id)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }

            if (! $shouldBeDefault && $address->is_default) {
                $fallbackAddress = Address::query()
                    ->where('user_id', $address->user_id)
                    ->where('id', '!=', $address->id)
                    ->orderByDesc('updated_at')
                    ->first();

                if ($fallbackAddress === null) {
                    $shouldBeDefault = true;
                } else {
                    $fallbackAddress->update(['is_default' => true]);
                }
            }

            $address->update([
                ...$payload,
                'is_default' => $shouldBeDefault,
            ]);
        });

        return to_route('account.addresses.index')
            ->with('success', 'Address updated.');
    }

    public function destroy(Address $address): RedirectResponse
    {
        Gate::authorize('delete', $address);

        DB::transaction(function () use ($address): void {
            $userId = $address->user_id;
            $wasDefault = $address->is_default;

            $address->delete();

            if (! $wasDefault) {
                return;
            }

            $fallbackAddress = Address::query()
                ->where('user_id', $userId)
                ->orderByDesc('updated_at')
                ->first();

            if ($fallbackAddress === null) {
                return;
            }

            $fallbackAddress->update(['is_default' => true]);
        });

        return to_route('account.addresses.index')
            ->with('success', 'Address removed.');
    }

    public function setDefault(Address $address): RedirectResponse
    {
        Gate::authorize('update', $address);

        DB::transaction(function () use ($address): void {
            Address::query()
                ->where('user_id', $address->user_id)
                ->update(['is_default' => false]);

            $address->update(['is_default' => true]);
        });

        return to_route('account.addresses.index')
            ->with('success', 'Default address updated.');
    }
}
