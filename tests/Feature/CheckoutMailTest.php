<?php

namespace Tests\Feature;

use App\Mail\OrderPlaced;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CheckoutMailTest extends TestCase
{
    use RefreshDatabase;

    private function checkoutPayload(): array
    {
        return [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'phone' => '+1234567890',
            'address1' => '123 Main St',
            'city' => 'Berlin',
            'postal_code' => '10115',
            'country' => 'Germany',
        ];
    }

    private function withCartInSession(): static
    {
        $product = Product::factory()->create([
            'price' => 29.99,
            'stock' => 10,
            'is_active' => true,
        ]);

        $unitPriceCents = (int) round($product->price * 100);

        session()->put('cart', [
            'items' => [
                $product->id => [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'unit_price_cents' => $unitPriceCents,
                    'qty' => 2,
                ],
            ],
            'summary' => [
                'items_count' => 2,
                'unique_items_count' => 1,
                'subtotal_cents' => $unitPriceCents * 2,
                'subtotal' => number_format(($unitPriceCents * 2) / 100, 2),
            ],
        ]);

        return $this;
    }

    public function test_order_placed_mail_is_sent_after_successful_checkout(): void
    {
        Mail::fake();

        $this->withCartInSession()
            ->post(route('shop.checkout.store'), $this->checkoutPayload())
            ->assertRedirect();

        Mail::assertSent(OrderPlaced::class, function (OrderPlaced $mail) {
            return $mail->hasTo('john@example.com');
        });
    }

    public function test_order_placed_mail_is_sent_only_once(): void
    {
        Mail::fake();

        $this->withCartInSession()
            ->post(route('shop.checkout.store'), $this->checkoutPayload());

        Mail::assertSentCount(1);
    }

    public function test_order_placed_mail_has_correct_order_reference(): void
    {
        Mail::fake();

        $this->withCartInSession()
            ->post(route('shop.checkout.store'), $this->checkoutPayload());

        Mail::assertSent(OrderPlaced::class, function (OrderPlaced $mail) {
            return $mail->order->email === 'john@example.com'
                && filled($mail->order->public_id);
        });
    }

    public function test_no_mail_sent_when_cart_is_empty(): void
    {
        Mail::fake();

        $this->post(route('shop.checkout.store'), $this->checkoutPayload());

        Mail::assertNothingSent();
    }

    public function test_order_placed_mail_has_pdf_attachment(): void
    {
        Mail::fake();

        $this->withCartInSession()
            ->post(route('shop.checkout.store'), $this->checkoutPayload());

        Mail::assertSent(OrderPlaced::class, function (OrderPlaced $mail) {
            $attachments = $mail->attachments();

            return count($attachments) === 1
                && str_starts_with($attachments[0]->as ?? '', 'invoice-');
        });
    }
}
