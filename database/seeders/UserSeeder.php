<?php

namespace Database\Seeders;

use App\Enums\CustomerTier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin user (platinum tier for demos)
        User::factory()->platinum()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Guarantee at least 3 of each remaining tier
        collect([
            CustomerTier::Bronze => 3,
            CustomerTier::Silver => 3,
            CustomerTier::Gold => 3,
            CustomerTier::Platinum => 2,
        ])->each(function (int $count, CustomerTier $tier) {
            User::factory()->{strtolower($tier->value)}()->count($count)->create();
        });

        // Extra users with random tier distribution
        User::factory()->count(20)->create();
    }
}
