<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserTierSeeder::class,
            AddressSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
