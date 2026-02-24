<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class AddressSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->each(function (User $user): void {
            $addresses = Address::factory()
                ->count(2)
                ->for($user)
                ->create();

            $firstAddress = $addresses->first();

            if ($firstAddress === null) {
                return;
            }

            $firstAddress->update(['is_default' => true]);
        });
    }
}
