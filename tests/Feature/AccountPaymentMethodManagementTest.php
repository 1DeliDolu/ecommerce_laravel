<?php

namespace Tests\Feature;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountPaymentMethodManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_only_their_own_payment_methods(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        PaymentMethod::factory()->asDefault()->for($user)->create([
            'last_four' => '4242',
            'brand' => 'Visa',
        ]);
        PaymentMethod::factory()->for($user)->create();
        PaymentMethod::factory()->for($otherUser)->create();

        $this->actingAs($user)
            ->get(route('account.payment-methods.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('account/payment-methods/index')
                ->has('paymentMethods', 2)
                ->where('paymentMethods.0.last_four', '4242')
                ->where('paymentMethods.0.is_default', true)
            );
    }

    public function test_first_payment_method_is_automatically_marked_as_default(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('account.payment-methods.store'), $this->validPayload())
            ->assertRedirect(route('account.payment-methods.index'));

        $this->assertDatabaseHas('payment_methods', [
            'user_id' => $user->id,
            'card_holder_name' => 'Ada Lovelace',
            'last_four' => '4242',
            'is_default' => true,
        ]);
    }

    public function test_card_number_must_be_exactly_sixteen_digits(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->from(route('account.payment-methods.index'))
            ->post(route('account.payment-methods.store'), [
                ...$this->validPayload(),
                'card_number' => '424242424242424',
            ])
            ->assertRedirect(route('account.payment-methods.index'))
            ->assertSessionHasErrors(['card_number']);
    }

    public function test_user_can_update_a_payment_method(): void
    {
        $user = User::factory()->create();
        $paymentMethod = PaymentMethod::factory()->asDefault()->for($user)->create([
            'card_holder_name' => 'Old Name',
            'brand' => 'Visa',
            'last_four' => '1111',
        ]);

        $this->actingAs($user)
            ->patch(route('account.payment-methods.update', $paymentMethod), [
                'label' => 'Business Card',
                'card_holder_name' => 'Ada Byron',
                'card_number' => '5555555555554444',
                'cvc' => '123',
                'expiry_month' => 11,
                'expiry_year' => now()->year + 3,
                'is_default' => true,
            ])
            ->assertRedirect(route('account.payment-methods.index'));

        $this->assertDatabaseHas('payment_methods', [
            'id' => $paymentMethod->id,
            'label' => 'Business Card',
            'card_holder_name' => 'Ada Byron',
            'brand' => 'Mastercard',
            'last_four' => '4444',
            'expiry_month' => 11,
            'is_default' => true,
        ]);
    }

    public function test_user_can_set_another_payment_method_as_default(): void
    {
        $user = User::factory()->create();
        $first = PaymentMethod::factory()->asDefault()->for($user)->create();
        $second = PaymentMethod::factory()->for($user)->create();

        $this->actingAs($user)
            ->patch(route('account.payment-methods.setDefault', $second))
            ->assertRedirect(route('account.payment-methods.index'));

        $this->assertDatabaseHas('payment_methods', [
            'id' => $first->id,
            'is_default' => false,
        ]);
        $this->assertDatabaseHas('payment_methods', [
            'id' => $second->id,
            'is_default' => true,
        ]);
    }

    public function test_deleting_default_payment_method_assigns_another_default_payment_method(): void
    {
        $user = User::factory()->create();
        $defaultPaymentMethod = PaymentMethod::factory()->asDefault()->for($user)->create();
        $secondaryPaymentMethod = PaymentMethod::factory()->for($user)->create();

        $this->actingAs($user)
            ->delete(route('account.payment-methods.destroy', $defaultPaymentMethod))
            ->assertRedirect(route('account.payment-methods.index'));

        $this->assertDatabaseMissing('payment_methods', [
            'id' => $defaultPaymentMethod->id,
        ]);
        $this->assertDatabaseHas('payment_methods', [
            'id' => $secondaryPaymentMethod->id,
            'is_default' => true,
        ]);
    }

    public function test_user_cannot_update_another_users_payment_method(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $otherPaymentMethod = PaymentMethod::factory()->for($otherUser)->create();

        $this->actingAs($user)
            ->patch(route('account.payment-methods.update', $otherPaymentMethod), [
                ...$this->validPayload(),
                'is_default' => false,
            ])
            ->assertForbidden();
    }

    private function validPayload(): array
    {
        return [
            'label' => 'Primary Card',
            'card_holder_name' => 'Ada Lovelace',
            'card_number' => '4242424242424242',
            'cvc' => '123',
            'expiry_month' => 12,
            'expiry_year' => now()->year + 2,
            'is_default' => false,
        ];
    }
}
