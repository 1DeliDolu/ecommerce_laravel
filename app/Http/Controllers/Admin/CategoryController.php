<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Category::class, only: ['index']),
            new Middleware('can:create,'.Category::class, only: ['create', 'store']),
            new Middleware('can:view,category', only: ['show']),
            new Middleware('can:update,category', only: ['edit', 'update']),
            new Middleware('can:delete,category', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status', 'all'); // all|active|inactive
        $parent = $request->query('parent'); // parent_id

        $categories = Category::query()
            ->with(['parent:id,name,slug'])
            ->withCount('children')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($q) => $q->where('is_active', true))
            ->when($status === 'inactive', fn ($q) => $q->where('is_active', false))
            ->when($parent !== null && $parent !== '', fn ($q) => $q->where('parent_id', (int) $parent))
            ->orderByRaw('parent_id is null desc')
            ->orderBy('parent_id')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $parents = Category::query()
            ->select(['id', 'name', 'slug'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/categories/index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
                'parent' => $parent,
            ],
            'parents' => $parents,
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        $parents = Category::query()
            ->select(['id', 'name', 'slug'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/categories/create', [
            'parents' => $parents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);

        $validated['slug'] = $this->normalizeSlug(
            slug: (string) Arr::get($validated, 'slug', ''),
            name: (string) Arr::get($validated, 'name', ''),
            ignoreId: null
        );

        Category::create($validated);

        return to_route('admin.categories.index')->with('success', 'Category created.');
    }

    public function show(Category $category): Response
    {
        $category->load([
            'parent:id,name,slug',
            'children:id,parent_id,name,slug,is_active,sort_order',
        ]);

        return Inertia::render('admin/categories/show', [
            'category' => $category,
        ]);
    }

    public function edit(Category $category): Response
    {
        $parents = Category::query()
            ->select(['id', 'name', 'slug'])
            ->whereKeyNot($category->id)
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/categories/edit', [
            'category' => $category,
            'parents' => $parents,
        ]);
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $this->validatePayload($request, $category);

        $validated['slug'] = $this->normalizeSlug(
            slug: (string) Arr::get($validated, 'slug', ''),
            name: (string) Arr::get($validated, 'name', ''),
            ignoreId: $category->id
        );

        $category->update($validated);

        return to_route('admin.categories.index')->with('success', 'Category updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return back()->with('success', 'Category deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?Category $category = null): array
    {
        $ignoreId = $category?->id;

        return $request->validate([
            'parent_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
                $ignoreId ? Rule::notIn([$ignoreId]) : null,
            ],
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($ignoreId),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ]);
    }

    private function normalizeSlug(string $slug, string $name, ?int $ignoreId): string
    {
        $base = Str::slug($slug !== '' ? $slug : $name);

        if ($base === '') {
            $base = Str::random(8);
        }

        return $this->generateUniqueSlug($base, $ignoreId);
    }

    private function generateUniqueSlug(string $base, ?int $ignoreId): string
    {
        $slug = $base;
        $i = 2;

        while (
            Category::query()
                ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
