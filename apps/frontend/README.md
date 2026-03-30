# Nursery-SaaS Frontend

Modern frontend application for the Nursery-SaaS platform built with Next.js 14, React 18, and Tailwind CSS.

## Features

- Next.js 14 App Router
- TypeScript support
- Tailwind CSS with custom Nursery brand colors
- shadcn/ui components
- Internationalization with next-intl (7 languages)
- PWA support with offline capability
- Framer Motion animations
- Supabase integration
- React Query for data fetching
- Form management with React Hook Form
- Zod schema validation
- Sentry error tracking
- Jest testing framework
- Storybook for component development

## Languages Supported

- English (en)
- Portuguese Brazil (pt-BR)
- Spanish (es)
- German (de)
- French (fr)
- Italian (it)
- Hebrew (he)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the required variables:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)
- `SENTRY_DSN` - Sentry error tracking DSN (optional)

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test
```

### Storybook

```bash
npm run storybook
```

Storybook will be available at `http://localhost:6006`

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and layouts
│   ├── [locale]/       # Locale-specific routes
│   │   ├── auth/       # Authentication pages
│   │   ├── admin/      # Admin pages
│   │   ├── children/   # Children management
│   │   ├── employees/  # Employee management
│   │   ├── visits/     # Visit tracking
│   │   └── parent/     # Parent portal
│   └── layout.tsx      # Root layout
├── components/
│   ├── layout/         # Layout components (Sidebar, Topbar)
│   └── ui/             # Base UI components (Button, Input, Card)
├── lib/
│   ├── supabase/       # Supabase client setup
│   └── utils.ts        # Utility functions
├── i18n/               # Internationalization configuration
│   ├── routing.ts      # Locale routing config
│   └── request.ts      # i18n request configuration
└── middleware.ts       # Next.js middleware for locale detection
```

## Key Technologies

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **API Client**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Internationalization**: next-intl
- **Error Tracking**: Sentry
- **Testing**: Jest + React Testing Library
- **Component Library**: Storybook
- **PWA**: next-pwa

## Component Examples

### Button
```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="lg">
  Click me
</Button>
```

### Input
```tsx
import { Input } from '@/components/ui/input';

<Input placeholder="Enter text..." />
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

## Styling

The project uses Tailwind CSS with custom extensions:

### Primary Colors (Nursery Green)
```css
primary-50 to primary-900
```

### Secondary Colors (Nursery Blue)
```css
secondary-50 to secondary-900
```

### Dark Mode
Dark mode is supported via the `dark:` prefix and respects user's system preference.

## API Integration

Connect to your backend API:

```tsx
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('table_name')
  .select();
```

## PWA Features

The app includes PWA support with:
- Install prompt for supported browsers
- Offline capability
- Service worker caching
- Shortcut navigation
- Responsive design for all screen sizes

## Performance Optimizations

- Image optimization with Next.js Image component
- Code splitting and lazy loading
- CSS-in-JS with Tailwind CSS
- Server components for better performance
- React Query for efficient data fetching

## Security Headers

The app includes security headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is proprietary and confidential.
