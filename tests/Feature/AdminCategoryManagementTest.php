<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminCategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_categories_index_and_open_edit_page_by_slug(): void
    {
        $admin = User::factory()->create();
        $this->setAdminEmails($admin->email);

        $category = Category::factory()->create([
            'name' => 'Electronics',
            'slug' => 'electronics',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.categories.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/categories/index')
                ->where('categories.data.0.slug', $category->slug)
            );

        $this->actingAs($admin)
            ->get(route('admin.categories.edit', ['category' => $category->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/categories/edit')
                ->where('category.slug', $category->slug)
            );
    }

    public function test_admin_can_update_category_using_slug_route_parameter(): void
    {
        $admin = User::factory()->create();
        $this->setAdminEmails($admin->email);

        $category = Category::factory()->create([
            'name' => 'Office',
            'slug' => 'office',
            'is_active' => false,
            'sort_order' => 5,
        ]);

        $this->actingAs($admin)
            ->put(route('admin.categories.update', ['category' => $category->slug]), [
                'parent_id' => null,
                'name' => 'Office Essentials',
                'slug' => 'office-essentials',
                'description' => 'Updated description',
                'is_active' => true,
                'sort_order' => 12,
            ])
            ->assertRedirect(route('admin.categories.index'));

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Office Essentials',
            'slug' => 'office-essentials',
            'is_active' => 1,
            'sort_order' => 12,
        ]);
    }

    private function setAdminEmails(string $emails): void
    {
        putenv('ADMIN_EMAILS='.$emails);
        $_ENV['ADMIN_EMAILS'] = $emails;
        $_SERVER['ADMIN_EMAILS'] = $emails;
    }
}
