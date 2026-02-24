<?php

namespace Tests\Feature\Account;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentMethodControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── index ─────────────────────────────────────────────────────────────────

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('account.payment-methods.index'))
            ->assertRedirect(route('login'));
    }

    public function test_index_renders_page_with_users_methods(): void
    {
        $user = User::factory()->create();
        PaymentMethod::factory()->count(2)->create(['user_id' => $user->id]);
        PaymentMethod::factory()->create(); // belongs to someone else

        $this->actingAs($user)
            ->get(route('account.payment-methods.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('account/payment-methods/index')
                ->has('paymentMethods', 2)
            );
    }

    // ── store ─────────────────────────────────────────────────────────────────

    public function test_user_can_add_a_payment_method(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.payment-methods.store'), [
                'card_number' => '4111111111111111',
                'cardholder_name' => 'Jane Doe',
                'exp_month' => 12,
                'exp_year' => 2028,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payment_methods', [
            'user_id' => $user->id,
            'brand' => 'visa',
            'last4' => '1111',
        ]);
    }

    public function test_first_card_is_automatically_set_as_default(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.payment-methods.store'), [
                'card_number' => '5500000000000004',
                'cardholder_name' => 'John Doe',
                'exp_month' => 6,
                'exp_year' => 2027,
            ]);

        $this->assertTrue(
            PaymentMethod::where('user_id', $user->id)->first()->is_default
        );
    }

    public function test_second_card_is_not_automatically_default(): void
    {
        $user = User::factory()->create();
        PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => true]);

        $this->actingAs($user)
            ->post(route('account.payment-methods.store'), [
                'card_number' => '378282246310005',
                'cardholder_name' => 'Jane',
                'exp_month' => 1,
                'exp_year' => 2029,
            ]);

        $this->assertDatabaseHas('payment_methods', [
            'user_id' => $user->id,
            'last4' => '0005',
            'is_default' => false,
        ]);
    }

    public function test_store_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.payment-methods.store'), [])
            ->assertSessionHasErrors(['card_number', 'cardholder_name', 'exp_month', 'exp_year']);
    }

    public function test_store_rejects_invalid_card_number(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.payment-methods.store'), [
                'card_number' => '12345',
                'cardholder_name' => 'Jane',
                'exp_month' => 1,
                'exp_year' => 2030,
            ])
            ->assertSessionHasErrors(['card_number']);
    }

    public function test_store_rejects_unrecognised_card_brand(): void
    {
        $user = User::factory()->create();

        // Starts with 9 — not Visa/MC/Amex/Discover
        $this->actingAs($user)
            ->post(route('account.payment-methods.store'), [
                'card_number' => '9111111111111111',
                'cardholder_name' => 'Jane',
                'exp_month' => 1,
                'exp_year' => 2030,
            ])
            ->assertSessionHasErrors(['brand']);
    }

    // ── update ────────────────────────────────────────────────────────────────

    public function test_user_can_update_their_card(): void
    {
        $user = User::factory()->create();
        $method = PaymentMethod::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->patch(route('account.payment-methods.update', $method), [
                'card_number' => '5500000000000004',
                'cardholder_name' => 'Updated Name',
                'exp_month' => 3,
                'exp_year' => 2030,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payment_methods', [
            'id' => $method->id,
            'cardholder_name' => 'Updated Name',
            'last4' => '0004',
        ]);
    }

    public function test_user_cannot_update_another_users_card(): void
    {
        $user = User::factory()->create();
        $other = PaymentMethod::factory()->create(); // different user

        $this->actingAs($user)
            ->patch(route('account.payment-methods.update', $other), [
                'card_number' => '4111111111111111',
                'cardholder_name' => 'Hacker',
                'exp_month' => 1,
                'exp_year' => 2030,
            ])
            ->assertForbidden();
    }

    // ── destroy ───────────────────────────────────────────────────────────────

    public function test_user_can_delete_their_card(): void
    {
        $user = User::factory()->create();
        $method = PaymentMethod::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->delete(route('account.payment-methods.destroy', $method))
            ->assertRedirect();

        $this->assertDatabaseMissing('payment_methods', ['id' => $method->id]);
    }

    public function test_deleting_default_card_promotes_next_card(): void
    {
        $user = User::factory()->create();
        $default = PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => true]);
        $other = PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => false]);

        $this->actingAs($user)
            ->delete(route('account.payment-methods.destroy', $default));

        $this->assertTrue($other->fresh()->is_default);
    }

    public function test_user_cannot_delete_another_users_card(): void
    {
        $user = User::factory()->create();
        $other = PaymentMethod::factory()->create();

        $this->actingAs($user)
            ->delete(route('account.payment-methods.destroy', $other))
            ->assertForbidden();
    }

    // ── setDefault ────────────────────────────────────────────────────────────

    public function test_user_can_set_a_card_as_default(): void
    {
        $user = User::factory()->create();
        $first = PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => true]);
        $second = PaymentMethod::factory()->create(['user_id' => $user->id, 'is_default' => false]);

        $this->actingAs($user)
            ->patch(route('account.payment-methods.default', $second))
            ->assertRedirect();

        $this->assertFalse($first->fresh()->is_default);
        $this->assertTrue($second->fresh()->is_default);
    }

    public function test_user_cannot_set_another_users_card_as_default(): void
    {
        $user = User::factory()->create();
        $other = PaymentMethod::factory()->create();

        $this->actingAs($user)
            ->patch(route('account.payment-methods.default', $other))
            ->assertForbidden();
    }
}
