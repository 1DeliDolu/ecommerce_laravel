<?php

namespace Database\Seeders;

use App\Enums\CustomerTier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserTierSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedAdminUsers();
        $this->seedTierSamples();
    }

    private function seedAdminUsers(): void
    {
        $adminEmails = collect(explode(',', (string) env('ADMIN_EMAILS', '')))
            ->map(static fn (string $email): string => trim($email))
            ->filter();

        foreach ($adminEmails as $email) {
            $defaultName = Str::of((string) $email)
                ->before('@')
                ->replace(['.', '-', '_'], ' ')
                ->title()
                ->value();

            User::query()->firstOrCreate(
                ['email' => $email],
                [
                    'name' => $defaultName !== '' ? $defaultName : 'Admin',
                    'tier' => CustomerTier::Platinum->value,
                    'password' => 'password',
                    'email_verified_at' => now(),
                ],
            );
        }
    }

    private function seedTierSamples(): void
    {
        foreach (CustomerTier::cases() as $tier) {
            User::factory()
                ->count(3)
                ->create([
                    'tier' => $tier->value,
                ]);
        }
    }
}
