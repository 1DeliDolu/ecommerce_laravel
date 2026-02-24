# Settings Pages

Complete user settings management module built with React and Inertia.js v2. Provides secure account management, security settings, and appearance customization interfaces.

## Overview

The settings module contains a collection of pages for authenticated users to manage their account details, security, and preferences. Each page is designed with a consistent layout pattern using the settings sidebar navigation and follows modern React best practices.

## Pages

### Profile Settings

**File:** `profile.tsx`

Manage your account's personal information. Users can update their name and email address with real-time validation feedback.

**Features:**

- Update name and email
- Email verification workflow
- Real-time form validation
- Success feedback with transitions

**Key Dependencies:**

- `ProfileController.update` - Backend form handler
- `@/routes/profile` - Route helpers
- `@/routes/verification` - Email verification endpoint

---

### Password Settings

**File:** `password.tsx`

Securely update your account password with confirmation requirements.

**Features:**

- Current password verification
- Password confirmation matching
- Strength validation
- Auto-reset on success/error

**Key Dependencies:**

- `PasswordController.update` - Backend form handler
- `@/routes/user-password` - Route helpers

---

### Appearance Settings

**File:** `appearance.tsx`

Customize the look and feel of your account interface.

**Features:**

- Theme selection (light/dark mode)
- Interface preferences
- Tabbed settings layout via `AppearanceTabs` component

**Key Dependencies:**

- `@/routes/appearance` - Route helpers
- `AppearanceTabs` component

---

### Two-Factor Authentication

**File:** `two-factor.tsx`

Enable enhanced account security with two-factor authentication.

**Features:**

- QR code generation for authenticator apps
- Manual setup key alternative
- Recovery codes management
- Enable/disable 2FA toggle
- Status indication (enabled/disabled)

**Key Dependencies:**

- `useTwoFactorAuth()` - Custom hook for 2FA logic
- `TwoFactorSetupModal` - Setup workflow component
- `TwoFactorRecoveryCodes` - Recovery codes display
- `@/routes/two-factor` - Route helpers

---

## Structure

```
settings/
├── README.md              # This file
├── profile.tsx            # Profile information management
├── password.tsx           # Password update form
├── appearance.tsx         # Appearance preferences
└── two-factor.tsx         # Two-factor authentication setup
```

## Layout Architecture

All pages use a consistent layout structure:

1. **AppLayout** - Main app wrapper with breadcrumbs and header
2. **SettingsLayout** - Sidebar navigation for settings sections
3. **Content Area** - Page-specific forms and controls

```tsx
<AppLayout breadcrumbs={breadcrumbs}>
    <SettingsLayout>{/* Page content */}</SettingsLayout>
</AppLayout>
```

## Common Patterns

### Form Handling with Inertia

Forms use Inertia's `<Form>` component with Wayfinder-generated actions:

```tsx
<Form
    {...ControllerAction.form()}
    options={{ preserveScroll: true }}
    resetOnSuccess
>
    {/* Form fields */}
</Form>
```

### Error Display

Input errors are shown with the `InputError` component:

```tsx
<InputError message={form.errors.fieldName} />
```

### Success Feedback

Transitions provide visual feedback on form submission:

```tsx
<Transition show={/* condition */} enter="transition ease-in-out duration-150">
    {/* Success message */}
</Transition>
```

## Components Used

- **UI Components:** Button, Input, Label, Badge
- **Layout:** AppLayout, SettingsLayout
- **Custom:** Heading, InputError, DeleteUser
- **Modal:** TwoFactorSetupModal
- **Tables:** TwoFactorRecoveryCodes

## Hook Integration

- `usePage()` - Access page props and auth data
- `useTwoFactorAuth()` - Manage 2FA state and QR code generation
- `useRef()` - Focus management for form inputs

## Breadcrumb Navigation

Each page defines breadcrumbs for consistent navigation:

```tsx
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Page Title',
        href: route().url,
    },
];
```

## Development

### Adding a New Settings Page

1. Create a new `.tsx` file in this directory
2. Wrap content with `AppLayout` and `SettingsLayout`
3. Define breadcrumbs constant
4. Use Inertia's `<Head>` component for page title
5. Integrate with appropriate backend controller via Wayfinder

### Styling Conventions

All pages use Tailwind CSS v4 with:

- `space-y-6` for vertical spacing between sections
- `@/components/ui/*` for button, input, and badge components
- Consistent heading hierarchy via `Heading` component

## Backend Integration

Settings pages are powered by Laravel controllers:

- Settings routing is configured in `routes/settings.php`
- Controllers handle validation via Form Request classes
- Inertia renders the React component with validated data

## Form Request Classes

Form requests with validation are located in:

- `app/Http/Requests/Settings/` directory
- Include custom error messages and rules
- Are referenced by their controller actions

---

**Last Updated:** February 2026
