<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountAddressManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_only_their_own_addresses(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $defaultAddress = Address::factory()->asDefault()->for($user)->create([
            'line1' => 'Primary Address 1',
        ]);
        Address::factory()->for($user)->create();
        Address::factory()->for($otherUser)->create();

        $this->actingAs($user)
            ->get(route('account.addresses.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('account/addresses/index')
                ->has('addresses', 2)
                ->where('addresses.0.line1', 'Primary Address 1')
                ->where('addresses.0.is_default', true)
                ->where('auth.default_address.id', $defaultAddress->id)
            );
    }

    public function test_first_address_is_automatically_marked_as_default(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.addresses.store'), [
                'label' => 'Home',
                'first_name' => 'Ada',
                'last_name' => 'Lovelace',
                'phone' => '+90 555 111 22 33',
                'line1' => 'Taksim Square 1',
                'line2' => null,
                'city' => 'Istanbul',
                'state' => null,
                'postal_code' => '34000',
                'country' => 'Turkey',
            ])
            ->assertRedirect(route('account.addresses.index'));

        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'line1' => 'Taksim Square 1',
            'is_default' => true,
        ]);
    }

    public function test_user_can_update_an_address(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->for($user)->create([
            'city' => 'Ankara',
            'is_default' => true,
        ]);

        $this->actingAs($user)
            ->patch(route('account.addresses.update', $address), [
                'label' => 'Office',
                'first_name' => $address->first_name,
                'last_name' => $address->last_name,
                'phone' => $address->phone,
                'line1' => $address->line1,
                'line2' => $address->line2,
                'city' => 'Izmir',
                'state' => $address->state,
                'postal_code' => $address->postal_code,
                'country' => $address->country,
                'is_default' => true,
            ])
            ->assertRedirect(route('account.addresses.index'));

        $this->assertDatabaseHas('addresses', [
            'id' => $address->id,
            'label' => 'Office',
            'city' => 'Izmir',
            'is_default' => true,
        ]);
    }

    public function test_user_can_set_another_address_as_default(): void
    {
        $user = User::factory()->create();
        $first = Address::factory()->asDefault()->for($user)->create();
        $second = Address::factory()->for($user)->create();

        $this->actingAs($user)
            ->patch(route('account.addresses.setDefault', $second))
            ->assertRedirect(route('account.addresses.index'));

        $this->assertDatabaseHas('addresses', [
            'id' => $first->id,
            'is_default' => false,
        ]);
        $this->assertDatabaseHas('addresses', [
            'id' => $second->id,
            'is_default' => true,
        ]);
    }

    public function test_deleting_default_address_assigns_another_default_address(): void
    {
        $user = User::factory()->create();
        $defaultAddress = Address::factory()->asDefault()->for($user)->create();
        $secondaryAddress = Address::factory()->for($user)->create();

        $this->actingAs($user)
            ->delete(route('account.addresses.destroy', $defaultAddress))
            ->assertRedirect(route('account.addresses.index'));

        $this->assertDatabaseMissing('addresses', [
            'id' => $defaultAddress->id,
        ]);
        $this->assertDatabaseHas('addresses', [
            'id' => $secondaryAddress->id,
            'is_default' => true,
        ]);
    }

    public function test_user_cannot_update_another_users_address(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $otherAddress = Address::factory()->for($otherUser)->create();

        $this->actingAs($user)
            ->patch(route('account.addresses.update', $otherAddress), [
                'label' => 'Attempt',
                'first_name' => 'Test',
                'last_name' => 'User',
                'phone' => null,
                'line1' => 'Line',
                'line2' => null,
                'city' => 'City',
                'state' => null,
                'postal_code' => '00000',
                'country' => 'Country',
                'is_default' => false,
            ])
            ->assertForbidden();
    }

    public function test_address_create_requires_mandatory_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.addresses.index'))
            ->post(route('account.addresses.store'), [
                'label' => 'Home',
                'first_name' => '',
                'last_name' => '',
                'line1' => '',
                'city' => '',
                'postal_code' => '',
                'country' => '',
            ])
            ->assertRedirect(route('account.addresses.index'))
            ->assertSessionHasErrors([
                'first_name',
                'last_name',
                'line1',
                'city',
                'postal_code',
                'country',
            ]);
    }
}
