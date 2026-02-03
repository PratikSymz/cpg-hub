# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage report
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.jsx
```

## Architecture Overview

CPG Hub is a React 19 + Vite application connecting CPG (Consumer Packaged Goods) brands with fractional talent and service providers.

### Authentication & Database
- **Clerk** for authentication (`@clerk/clerk-react`). User roles stored in `user.unsafeMetadata.roles[]`
- **Supabase** for database and storage. All API calls go through `src/utils/supabase.js` which injects Clerk tokens for RLS

### Data Flow Pattern
API functions follow this pattern:
```javascript
// src/api/apiExample.js
export async function getData(token, { param_id }) {
  const supabase = supabaseClient(token);
  // ... supabase query
}
```

Components use the `useFetch` hook which automatically gets Clerk session tokens:
```javascript
const { func, data, loading, error } = useFetch(getData);
useEffect(() => { func({ param_id: id }); }, []);
```

### User Roles
Three roles defined in `src/constants/roles.js`: `brand`, `talent`, `service`
- Roles are stored in Clerk user metadata and checked for feature access
- Admin users defined in `src/constants/admins.js` have elevated permissions

### Route Structure
All routes use `AppLayout` wrapper with navbar and footer. Key route patterns:
- Listing pages: `/jobs`, `/talents`, `/services`
- Detail pages: `/job/:id`, `/talents/:id`, `/services/:id`
- Edit pages: `/edit-job/:id`, `/edit-talent/:id`, `/edit-service/:id`
- Onboarding: `/onboarding/brand`, `/onboarding/talent`, `/onboarding/service`

### UI Design System
- Tailwind CSS 4 with custom colors: `cpg-teal`, `cpg-brown`
- Radix UI primitives in `src/components/ui/`
- Common patterns: `gradient-title` for page headers, `rounded-2xl` cards with `border-2 border-gray-100`
- Form validation: React Hook Form + Zod schemas in `src/schemas/`

### Key Directories
- `src/api/` - Supabase API functions (one file per entity)
- `src/pages/` - Route components organized by feature (jobs/, talent/, service/, brand/)
- `src/components/` - Shared components; `ui/` contains base Radix primitives
- `src/constants/` - Filters, roles, admin IDs, class name utilities
- `src/schemas/` - Zod validation schemas

### Supabase Edge Functions
Located in `supabase/functions/`. Deploy with:
```bash
supabase functions deploy <function-name>
```

**cleanup-expired-jobs** - Automatically deletes job posts older than 30 days and emails posters
- Deployed with `--no-verify-jwt` (no auth required for cron access)
- Cron job configured via pg_cron: runs daily at 9 AM UTC
- To check cron jobs: `SELECT * FROM cron.job;`
- To manually invoke: `curl -X POST https://yddcboiyncaqmciytwjx.supabase.co/functions/v1/cleanup-expired-jobs`

### Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Clerk keys (configured via Clerk dashboard)
