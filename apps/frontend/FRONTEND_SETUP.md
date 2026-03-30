# Frontend Application Setup

This document explains the frontend architecture and how to get started.

## Project Structure

```
apps/frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # Locale-based routing
│   │   │   ├── auth/                 # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   ├── signup/
│   │   │   │   └── reset-password/
│   │   │   ├── children/             # Children management
│   │   │   │   ├── new/              # Create child form
│   │   │   │   ├── [id]/             # Child detail page
│   │   │   │   └── page.tsx          # Children list
│   │   │   ├── layout.tsx            # Locale layout with auth protection
│   │   │   └── page.tsx              # Dashboard
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # Navigation sidebar
│   │   │   └── topbar.tsx            # Top navigation bar
│   │   └── ui/                       # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── modal.tsx             # Dialog/Modal component
│   │       ├── data-table.tsx        # Reusable data table
│   │       ├── form-field.tsx        # Form field wrapper
│   │       ├── loading.tsx           # Loading spinners & skeletons
│   │       ├── toast.tsx             # Toast notifications
│   │       └── stat-card.tsx         # Dashboard stat card
│   ├── lib/
│   │   ├── api.ts                    # API client with auth
│   │   ├── auth-context.tsx          # Authentication context
│   │   ├── supabase/
│   │   │   ├── client.ts             # Supabase client instance
│   │   │   └── server.ts             # Server-side Supabase client
│   │   ├── hooks/
│   │   │   ├── use-auth.ts           # Auth context hook
│   │   │   └── use-api.ts            # Data fetching hooks
│   │   ├── utils.ts
│   │   └── i18n/
│   │       ├── locales/              # Translation files
│   │       ├── request.ts
│   │       └── routing.ts
```

## Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rcbbwninexczkzccfwiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Key Features

### Authentication
- Login with email/password
- Sign up with automatic profile creation
- Password reset via email
- Session management with Supabase Auth
- Protected routes with automatic redirect to login

### Core Infrastructure

#### API Client (`lib/api.ts`)
- Automatically attaches Supabase auth tokens
- Handles JSON serialization/deserialization
- Error handling with descriptive messages

```typescript
// Usage examples
const user = await apiGet<User>('/api/v1/auth/me');
const child = await apiPost<Child>('/api/v1/children', childData);
```

#### Auth Context (`lib/auth-context.tsx`)
- Global authentication state management
- User profile with roles/permissions
- Sign in, sign up, sign out methods
- Loading and error states

```typescript
// Usage in components
const { user, userProfile, signIn, signOut } = useAuth();
```

#### Data Fetching Hooks (`lib/hooks/use-api.ts`)
- `useApiQuery<T>(path, deps)` - GET requests with caching
- `useApiMutation<T>(path, method)` - POST/PATCH/DELETE operations

```typescript
// Query example
const { data, loading, error, refetch } = useApiQuery<Child>('/api/v1/children/1');

// Mutation example
const { execute, loading } = useApiMutation<Child>('/api/v1/children', 'POST');
await execute(childData);
```

### UI Components

All components use:
- **Tailwind CSS** for styling (green-500 primary, blue-500 secondary)
- **Lucide React** for icons
- **Framer Motion** for animations
- **Radix UI** primitives for accessibility

Key components:
- `DataTable` - Sortable/filterable data tables with pagination
- `Modal` - Dialog component
- `FormField` - Wrapped form inputs with labels and errors
- `LoadingSpinner` - Loading indicators
- `DataTableSkeleton` - Loading placeholders

### Pages

#### Login (`/auth/login`)
- Email/password authentication
- Link to signup and forgot password
- Error handling
- Redirect to dashboard on success

#### Signup (`/auth/signup`)
- Email, password, name fields
- Password confirmation validation
- Automatic profile creation
- Redirect to login on success

#### Dashboard (`/`)
- Shows key metrics (children count, staff, visits, etc.)
- Quick action buttons
- Recent activity feed
- Fetches data from `/api/v1/dashboard/stats`

#### Children List (`/children`)
- Table view of all children
- Search by name
- Pagination
- Click row to view details
- Add child button

#### Create Child (`/children/new`)
- Multi-step form (2 steps)
- Step 1: Personal info (name, DOB, gender, class, blood type)
- Step 2: Emergency contact & medical info
- Form validation with error display
- Redirect to child detail on success

#### Child Detail (`/children/:id`)
- View all child information
- Personal, medical, emergency contact details
- Status indicator
- Edit/Delete actions
- Delete confirmation dialog

## Development

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Build for production
```bash
npm run build
npm start
```

### Run tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## API Integration

The frontend expects the backend API at `http://localhost:3001` (configurable via `NEXT_PUBLIC_API_URL`).

### Expected API Endpoints

```
POST   /api/v1/auth/login
POST   /api/v1/auth/signup
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
GET    /api/v1/dashboard/stats
GET    /api/v1/children
GET    /api/v1/children/:id
POST   /api/v1/children
PATCH  /api/v1/children/:id
DELETE /api/v1/children/:id
```

All endpoints require bearer token authentication (Supabase session token).

## Styling

- **Primary Color**: Green-500 (#22c55e)
- **Secondary Color**: Blue-500 (#3b82f6)
- **Framework**: Tailwind CSS with dark mode support

Custom colors are applied via Tailwind utility classes. No additional CSS files needed.

## Internationalization (i18n)

Built-in with `next-intl` and locale-based routing. Translations are in `src/i18n/locales/`.

## Performance Optimization

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Skeleton loaders for better perceived performance
- Debounced search inputs
- Efficient API query caching with `useApiQuery`

## Security

- Automatic CSRF protection via Supabase
- Secure session tokens
- Protected routes with auth check
- No sensitive data in localStorage (using Supabase secure session)
- Input validation with Zod schemas
- XSS protection via React's built-in escaping

## Common Tasks

### Adding a new page
1. Create a new route folder in `app/[locale]/`
2. Add `page.tsx` with your component
3. Use `useAuth()` to check permissions
4. Use `useApiQuery()` for data fetching

### Adding a new API call
1. Use `apiGet()`, `apiPost()`, etc. from `lib/api.ts`
2. Or use `useApiQuery()` hook for automatic loading states
3. Add proper error handling

### Creating a form
1. Use `FormField` component for consistency
2. Add Zod schema for validation
3. Use `useApiMutation()` to submit
4. Display errors from validation

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### "Unauthorized" errors
- Ensure Supabase session is valid
- Check that API endpoints require valid JWT tokens
- Verify backend is running on correct port

### "Cannot find module" errors
- Run `npm install` to install dependencies
- Clear Next.js cache: `rm -rf .next`
- Restart dev server

## Next Steps

1. Install dependencies: `npm install`
2. Configure `.env.local` with Supabase credentials
3. Start backend API on port 3001
4. Run `npm run dev` to start frontend
5. Visit `http://localhost:3000/en` (or your locale)
