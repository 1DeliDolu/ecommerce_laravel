<?php

namespace Tests\Feature\Account;

use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── index ─────────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('account.addresses.index'))
            ->assertRedirect(route('login'));
    }

    public function test_index_returns_only_users_addresses(): void
    {
        $user = User::factory()->create();
        UserAddress::factory()->count(3)->create(['user_id' => $user->id]);
        UserAddress::factory()->create(); // another user

        $this->actingAs($user)
            ->get(route('account.addresses.index'))
            ->assertOk()
            ->assertInertia(fn ($p) => $p
                ->component('account/addresses/index')
                ->has('addresses', 3)
            );
    }

    // ── store ─────────────────────────────────────────────────────────────────

    public function test_user_can_add_an_address(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.addresses.store'), [
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'address1' => '123 Main St',
                'city' => 'Berlin',
                'postal_code' => '10115',
                'country' => 'Germany',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_addresses', [
            'user_id' => $user->id,
            'first_name' => 'Jane',
            'city' => 'Berlin',
        ]);
    }

    public function test_first_address_is_automatically_default(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('account.addresses.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'address1' => '123 Main St',
            'city' => 'Berlin',
            'postal_code' => '10115',
            'country' => 'Germany',
        ]);

        $this->assertTrue(UserAddress::where('user_id', $user->id)->first()->is_default);
    }

    public function test_store_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.addresses.store'), [])
            ->assertSessionHasErrors(['first_name', 'last_name', 'address1', 'city', 'postal_code', 'country']);
    }

    // ── update ────────────────────────────────────────────────────────────────

    public function test_user_can_update_their_address(): void
    {
        $user = User::factory()->create();
        $address = UserAddress::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->patch(route('account.addresses.update', $address), [
                'first_name' => 'Updated',
                'last_name' => 'Name',
                'address1' => '999 New Rd',
                'city' => 'Munich',
                'postal_code' => '80331',
                'country' => 'Germany',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('user_addresses', ['id' => $address->id, 'city' => 'Munich']);
    }

    public function test_user_cannot_update_another_users_address(): void
    {
        $user = User::factory()->create();
        $other = UserAddress::factory()->create();

        $this->actingAs($user)
            ->patch(route('account.addresses.update', $other), [
                'first_name' => 'Hacker',
                'last_name' => 'X',
                'address1' => '1 Bad St',
                'city' => 'Nowhere',
                'postal_code' => '00000',
                'country' => 'Anywhere',
            ])
            ->assertForbidden();
    }

    // ── destroy ───────────────────────────────────────────────────────────────

    public function test_user_can_delete_their_address(): void
    {
        $user = User::factory()->create();
        $address = UserAddress::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->delete(route('account.addresses.destroy', $address))
            ->assertRedirect();

        $this->assertDatabaseMissing('user_addresses', ['id' => $address->id]);
    }

    public function test_deleting_default_address_promotes_next(): void
    {
        $user = User::factory()->create();
        $default = UserAddress::factory()->create(['user_id' => $user->id, 'is_default' => true]);
        $other = UserAddress::factory()->create(['user_id' => $user->id, 'is_default' => false]);

        $this->actingAs($user)->delete(route('account.addresses.destroy', $default));

        $this->assertTrue($other->fresh()->is_default);
    }

    public function test_user_cannot_delete_another_users_address(): void
    {
        $user = User::factory()->create();
        $other = UserAddress::factory()->create();

        $this->actingAs($user)
            ->delete(route('account.addresses.destroy', $other))
            ->assertForbidden();
    }

    // ── setDefault ────────────────────────────────────────────────────────────

    public function test_user_can_set_default_address(): void
    {
        $user = User::factory()->create();
        $first = UserAddress::factory()->create(['user_id' => $user->id, 'is_default' => true]);
        $second = UserAddress::factory()->create(['user_id' => $user->id, 'is_default' => false]);

        $this->actingAs($user)
            ->patch(route('account.addresses.default', $second))
            ->assertRedirect();

        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_user_cannot_set_another_users_address_as_default(): void
    {
        $user = User::factory()->create();
        $other = UserAddress::factory()->create();

        $this->actingAs($user)
            ->patch(route('account.addresses.default', $other))
            ->assertForbidden();
    }
}
