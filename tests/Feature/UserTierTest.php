<?php

namespace Tests\Feature;

use App\Enums\CustomerTier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserTierTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_tier_defaults_to_bronze_when_not_provided(): void
    {
        $email = Str::uuid()->toString().'@example.test';

        $user = User::query()->create([
            'name' => 'Tierless User',
            'email' => $email,
            'password' => 'password',
        ]);

        $this->assertSame(CustomerTier::Bronze, $user->fresh()->tier);
    }

    public function test_user_factory_can_create_specific_tiers(): void
    {
        $this->assertSame(CustomerTier::Platinum, User::factory()->platinum()->create()->tier);
        $this->assertSame(CustomerTier::Gold, User::factory()->gold()->create()->tier);
        $this->assertSame(CustomerTier::Silver, User::factory()->silver()->create()->tier);
        $this->assertSame(CustomerTier::Bronze, User::factory()->bronze()->create()->tier);
    }

    public function test_authenticated_user_can_see_tier_badge_in_profile_page(): void
    {
        $user = User::factory()->gold()->create();

        $this->actingAs($user)
            ->get(route('profile.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/profile')
                ->where('auth.user.tier', CustomerTier::Gold->value)
            );
    }
}
