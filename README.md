# Blokpakt

## Our story

**Home services, organized around the neighborhood. Not trading. Not investing.**

Everyday home maintenance can be harder to arrange than it should be. A household
needs its lawn cared for, gutters cleaned, driveway washed, or snow cleared.
An independent provider needs enough worthwhile work without spending the day
driving between scattered jobs and negotiating each one from scratch.

Blokpakt starts with a simple question: what if neighbors who need similar work
could be served together?

We are building an asset-light home-services marketplace, not buying a fleet or
employing a full-time crew. Our intended role is to bring local demand together,
work with independent providers, and make the experience clearer for both sides.
Denser work may reduce travel and improve provider economics. That is a
hypothesis to test, not a promise of a particular saving or profit.

Our approach is deliberately practical:

1. **Notice the friction.** Start with a real home-service coordination problem,
   not a fashionable technology or an unrelated business category.
2. **Build the smallest useful version.** Preserve a welcoming website, let a
   customer send a clear request, and give an operator a reliable way to act on it.
3. **Test a small pilot.** Begin in the US, confirm each address, service,
   contractor, quote, and date manually, and learn where demand actually exists.
   We have not established nationwide coverage.
4. **Improve what evidence supports.** Measure requests, fulfillment problems,
   customer feedback, and provider economics before scaling. Add automation only
   where it helps; AI is optional.

This is our product direction, not a claim of completed field research, existing
revenue, or a guaranteed market size. The lesson from a small physical-product
prototype is the process: observe, make, test, refine. Someone else's founder
story and sales estimates are not Blokpakt's history.

For AI collaborators, read [AGENTS.md](./AGENTS.md) before proposing changes.
Gemini CLI can import it through [GEMINI.md](./GEMINI.md); use `/memory show` to
check loaded context. Other Gemini interfaces may need the story supplied
manually. Instructions reduce drift; tests and human review still matter.

## Product basis and offline notebooks

Read [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) for the owner-approved product
identity, the role of the free home planner, proposed growth gates, and a
checklist for future AI collaborators. It separates facts, hypotheses, examples,
and drafts rather than inventing a business model.

### Free Home & Time Planner

- Open `/home-planner.html` from the homepage's **Open the free home planner**
  card or **Free Home Planner** footer link. **Download for offline use** saves
  a single HTML file; double-click it in a modern browser. No install, backend,
  CDN, online chart library, or sign-in is required.
- The source is [public/home-planner.html](./public/home-planner.html). Vite
  copies it unchanged to the public build; it is not a React route or a live
  service-request screen.
- Includes effective hourly pay with expanded formulas, a quick ledger, four
  latest entries across months, monthly summaries, a safety buffer and free-fund
  goal, an SVG projection, and non-saving commute/overtime/pay scenarios.
- Salary is annualized across 12 months. Work costs are subtracted once; do not
  also log them as expenses. Fixed entries apply only to their dated month.
  Goal timing includes any safety-buffer shortfall before the free-fund target.
  Settings apply to every planning month, not historical payroll periods.
- **Backup & data** offers **Download backup**, **Restore backup**, and confirmed
  example-only cleanup. The interface explains saving/restoring a file without
  requiring users to know JSON or edit the file. Restoring replaces current data,
  rather than merging it; download a backup first to keep the current copy.
  Initial examples use the current local date and are clearly marked. Cleanup
  keeps personal entries and explicitly saved custom pay/goal settings. Downloads
  contain the fresh tool with examples, not personal figures; download a separate
  backup too. The underlying JSON format and existing backups remain compatible.
- No automatic requests, analytics, account integration, or planner-data uploads.
  The optional **Meet Blokpakt** link goes online only when clicked and carries no
  planner values. This is a planning aid, not financial advice, a quote, or a
  savings guarantee. No advertising campaign or tracking has been launched.
- Local storage and JSON are not encrypted. Online and downloaded copies do not
  sync. Export before moving the file or clearing storage. Some browsers limit
  local-file storage: keep a backup and resolve any visible save warning.
- Existing same-origin data keeps the legacy `little-mint.workspace.v1` key and
  version-1 backup format. The original
  [offline-workspace.html](./offline-workspace.html) location is now a read-only
  recovery/export page, so a browser's old file-local storage can be backed up
  before switching paths.

### Local owner notebook

Double-click [owner-workspace.html](./owner-workspace.html). It is intentionally
outside `public/`, absent from site navigation, and excluded from the production
website build. This is a local planning tool, **not an authenticated admin page**.
Do not publish it as one or store customer records, credentials, or secrets.

- The vertical growth path starts with 0, then draft household thresholds
  10, 50, 100, and 500, with the feature/focus below each number. Edit the cards
  locally; thresholds must stay increasing and the first remains zero.
- The real household count starts **Not recorded**. An optional local aggregate
  needs an observation date and non-sensitive source. Nothing queries Supabase
  or treats reaching a threshold as a feature launch.
- Add, edit, complete, filter, and delete next steps, attach them to a milestone,
  and choose due dates. The overview shows overdue items and the next seven days.
  These reminders work only while open or upon reopening: no email or push.
- Starter tasks are suggestions without imposed deadlines. Saving edits or
  checking them off adopts them; **Remove untouched starters** preserves adopted
  and user-created tasks. Save your edits before cleanup.
- **Backups** offers **Download backup** and **Restore backup**, with confirmation before
  replacement or erasure, and never clears the financial planner or other keys.
  Corrupt data and other-tab changes pause writes rather than silently overwrite.
  Owner backups and home-planner backups have separate schemas and storage keys.

## Real service-request pilot

The pilot implementation is separate from the demo. See
[email, database, administrator, and launch setup](./supabase/PILOT_SETUP.md).
No cloud migration, real email delivery, service coverage, or deployment is
assumed to be verified merely because the code builds.

## Blokpakt prototype

The default marketplace remains a browser-only demo with real Supabase email
sign-in. Separate service-request pilot pages use guarded database APIs after
setup. No payment system is enabled. Keep the existing design when extending it.

- Book at `/book`, follow the tracking link, and switch to `/field` to accept a whole route.
- Arrive, save before/after photos, request an optional extra, approve it from the customer view, then complete the job.
- Demo jobs and photos survive reloads in the same tab using `sessionStorage`. They are not shared across devices or tabs. Use sample information only; closing the tab ends the demo session.
- The provider screen starts with a four-stop sample route. New bookings use rule-based street/service/date grouping (maximum six stops), not AI or geographic route optimization.
- No card is authorized, no payout is sent, and no support report is submitted.
- Secondary pages are route-split; the matched page module resolves before client hydration so server-rendered page content is preserved.

See [ROADMAP.md](./ROADMAP.md) for the approved scope and limitations.

### Email sign-in

- The header's **Log in** button opens `/login` on desktop and mobile. Customers
  can still explore and make demo bookings without signing in.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in local `.env` and in the
  deployment's build environment. Use only a publishable/anon key, never a
  service-role or secret key. Redeploy after changing these build-time settings.
- In Supabase **Authentication → URL Configuration**, set **Site URL** to your
  real website origin and add its exact `/auth/callback` URL under **Redirect
  URLs**. Add a separate callback for local testing, such as
  `http://localhost:5173/auth/callback`; use your actual port/host. Keep the
  default magic-link email template (the `ConfirmationURL` link).
- Email links use PKCE: open the email in the same browser that requested it.
  A successful email request is not a completed login. Invalid/expired links
  show an error and offer a new link; the app removes callback credentials
  from the address bar and always returns to `/login`, not a user-supplied URL.
- Supabase's default email sender has recipient restrictions and rate limits.
  Configure custom SMTP for general public use. Test delivery and the callback
  on the real hostname with an authorized email before launch.
- The account screen shows the verified email and supports signing out of this
  browser. Sessions persist across reloads. On a shared device, sign out after
  use. Demo data remains tab-local and is not imported, protected by login, or
  erased on sign-out: use sample data only.
- Authentication alone grants no provider/admin role or booking. Real service
  requests use the separate pilot described above; demo records are not migrated.
  The initial SQL foundation and evidence lock remain unchanged.

### Page-loading recovery

Route import failures now show branded reload/home actions instead of the default
router error page. React Router's native ESM imports are preserved in development
SSR; the obsolete CommonJS rewrite has been removed. Secondary routes remain
split for loading efficiency. If an actual deployed page still fails after reload,
inspect its failed module request, response status/content type, and deployment
asset availability. Do not reset the database to address a frontend import error.

### Management and feature-demand demo

- `/our-story` uses the green/orange neighborhood illustration, story cards,
  and expandable Q&A. Illustrations describe the concept, not actual routes;
  pilot limitations remain visible alongside the product direction.
- The demo dashboard has a green workspace header, wrapping section navigation,
  and category cards. The live `/ops` workspace (also served at `/admin` when
  live requests are enabled) uses matching styling, with its existing verified
  sign-in and administrator checks unchanged.
- Open `/admin` and use the default **Management** tab. Its four lists reflect
  the shared demo bookings, provider catalog/applications, derived customer
  contacts, and service catalog. The older operations tabs remain labeled samples.
- Search or filter records, save internal notes, and mark follow-up items.
  Pending bookings, pending applications, and follow-up counts appear as
  in-dashboard reminders. No emails or push notifications are sent.
- Submit a sample application through `/join`, then mark it reviewed in
  Management. Review does not grant provider access or add it to the catalog.
- Create a feature-demand test with a name, explanation and button label.
  Active tests appear under **What should Blokpakt build next?** on the homepage;
  paused tests are hidden. Every button explains that the feature is unavailable:
  it never books a service, takes payment, or pretends to join a waitlist.
- Demo measurement requires a separate, explicit local opt-in. These counters
  are not uploaded; existing site analytics consent remains separate. One view
  is counted per button mount once at least 50% is visible. A click arriving
  before the visibility callback also establishes that view. CTR is the share
  of measured views with at least one click; repeat clicks only raise total
  clicks. These are not unique visitors or site-wide production statistics.
- State persists in this tab's `sessionStorage`. Measurement is limited to 1,000
  views with an explicit error at the limit. Clearing demo metrics requires
  confirmation and leaves notes, applications, bookings and feature tests intact.
- This publicly reachable demo is **not an authenticated admin system**. Use
  sample data only. Supabase admin authorization and real analytics aggregation
  must be implemented before using it for real customer records.

### Supabase setup: database foundation

Connection settings alone do not switch the app out of demo mode. The initial
[SQL migration](./supabase/migrations/202610150001_marketplace_foundation.sql)
prepares a new, empty Supabase project:

1. Open the intended project's **SQL Editor** and create a new query.
2. Paste the entire migration, including `begin;` and `commit;`, then run it once.
3. Check **Table Editor** for `services`, `customer_profiles`, `providers`,
   `provider_services`, `route_blocks`, `bookings`, and `booking_photos`.
4. Check **Storage** for the private `blokpakt-evidence` bucket.
5. Leave RLS enabled. Do not add public read/write policies to make the demo work.

After success, run [the read-only setup check](./supabase/verify_foundation.sql)
in a separate SQL Editor query. Expect eight `PASS` rows. A `CHECK` row names
the missing or mismatched setup; share that result for diagnosis instead of
deleting tables or rerunning the creation script. This check returns metadata
only and is specific to the initial, locked foundation, not later API migrations.

The migration is transactional and does not delete existing data. If a named
table or bucket already exists, execution fails instead of overwriting it.
Do not rerun after success; if an error appears, keep the error text for diagnosis
rather than deleting tables or disabling RLS.

All services initially remain inactive. Browser writes, provider self-approval,
and direct evidence access are deliberately disabled. The next implementation
phase needs verified deployment/email configuration, validated booking/assignment operations,
private photo access, and cross-device tests before enabling real bookings.
Customers will not need to choose a password, but secure order access still uses
an internal verified Auth identity. No payments are enabled by this migration.

The [SQL regression checks](./supabase/tests/marketplace_foundation.sql) are for
an isolated local Supabase/PostgreSQL test database after applying the migration,
not the live project. They exercise RLS ownership, provider approval, address
visibility, route constraints, and the private bucket lock using rollback-only
fixtures.

A modern, production-ready web application template built with Vite, React, and TypeScript. Designed for AI-assisted development with component introspection, layout systems, and excellent developer experience.

## 🚀 Features

- **⚡ Lightning Fast**: Vite for instant hot module replacement and optimized builds
- **🎯 Type Safe**: Full TypeScript coverage across frontend and backend
- **🎨 Beautiful UI**: shadcn/ui components with Tailwind CSS
- **🧠 AI-Friendly**: Component introspection for AI development tools
- **📱 Responsive**: Mobile-first design with modern CSS
- **🔧 Developer Experience**: Hot reload, linting, formatting, and testing setup
- **🚀 Production Ready**: Server-side rendering (SSR), optimized builds, and deployment-ready

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern React with hooks and concurrent features
- **TypeScript 5** - Full type safety across the application
- **Vite 6** - Fast build tool and dev server with HMR
- **Tailwind CSS 3** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **React Router DOM 7** - Client-side routing
- **Motion** - Smooth animations and transitions

### Backend

- **Express API** - Health check, SSR, and extensible server routes
- **TypeScript** - Type-safe backend development

### Development Tools

- **ESLint 9** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Fast unit testing
- **TypeScript ESLint** - TypeScript-specific linting

> **Requirement:** Node.js 22 or later.

## 📁 Project Structure

```
v8-app-template/
├── src/
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui base components (40+ components)
│   │   └── Spinner.tsx
│   ├── layouts/          # Layout systems
│   │   ├── RootLayout.tsx    # Centralized layout wrapper
│   │   ├── Website.tsx       # Structural container
│   │   ├── Dashboard.tsx     # Dashboard layout
│   │   ├── RootLayout.md     # RootLayout documentation
│   │   ├── Website.md        # Website layout documentation
│   │   └── parts/            # Layout components
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── pages/            # Page components (content only)
│   │   ├── index.tsx     # Homepage
│   │   └── _404.tsx      # 404 page
│   ├── lib/              # Utilities and API
│   │   ├── utils.ts      # Utility functions
│   │   └── api-client.ts # API client
│   ├── server/           # Express API routes and SSR entry point
│   │   ├── api/health/GET.ts
│   │   └── entry.ts
│   ├── styles/           # Global styles
│   │   └── globals.css
│   ├── test/             # Test setup
│   │   └── setup.ts
│   ├── App.tsx           # Root application component
│   ├── main.tsx          # Application entry point
│   ├── router.ts         # Route definitions
│   └── routes.tsx        # Route components
├── dev-tools/            # Development mode enhancements
├── source-mapper/        # AI introspection plugin
├── public/               # Static assets
├── Dockerfile.dev        # Local Docker development image
└── vite.config.ts        # Vite, API, SSR, and plugin configuration
```

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the client and SSR server bundle for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run Vitest unit tests
- `npm run test:ui` - Open the Vitest UI
- `npm run test:coverage` - Run tests with coverage reporting
- `npm run audit` - Check dependencies for high-severity vulnerabilities
- `npm run lint` - Run ESLint code linting
- `npm run lint:fix` - Run ESLint and apply fixes where possible
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format source files with Prettier
- `npm run clean` - Remove build output and Vite's dependency cache
- `npm run reset` - Clean the project and reinstall dependencies

## 🎨 UI Components

This template includes shadcn/ui components that are:

- **Accessible** - Built with Radix UI primitives
- **Customizable** - Easy to modify and extend
- **Consistent** - Design system with CSS variables
- **Copy-paste friendly** - Own your components

The template includes 40+ pre-configured shadcn/ui components:

- **Layout**: Card, Separator, Tabs, Sheet, Dialog
- **Forms**: Button, Input, Textarea, Select, Checkbox, Switch
- **Navigation**: Navigation Menu, Breadcrumb, Pagination
- **Feedback**: Alert, Badge, Progress, Skeleton, Sonner
- **Data Display**: Table, Avatar, Calendar, Hover Card
- **Overlays**: Popover, Tooltip, Alert Dialog, Drawer
- **Interactive**: Accordion, Collapsible, Command, Context Menu

To add new components:

```bash
npx shadcn-ui@latest add component-name
```

## 🧠 AI Integration

### Component Introspection

The custom source-mapper plugin adds metadata to components in development:

```html
<div
  data-source-file="/src/components/Button.tsx"
  data-source-line="15"
  data-source-component="Button"
>
  Click Me
</div>
```

### Development Mode Integration

The dev-tools package provides:

- **Element selection**: Click to identify components
- **Live editing**: Modify component props in real-time
- **Source mapping**: Navigate directly to component source
- **AI integration**: Enhanced context for AI development tools

### AI-Friendly Patterns

- **Consistent naming**: PascalCase components, camelCase hooks
- **Clear file structure**: Logical separation of concerns
- **Type-first approach**: Comprehensive TypeScript types
- **Standard patterns**: CRUD operations, form handling, error boundaries

## 🗃️ API & Layouts

### API Routes

The template includes:

- `GET /api/health` - Health check endpoint
- Extensible API client setup in `src/lib/api-client.ts`

### Layout System

**RootLayout Pattern** (recommended for multi-page sites):

`App.tsx` already wraps every route in RootLayout, which renders a shared header and footer on every page. Customize them by editing `src/layouts/parts/Header.tsx` and `Footer.tsx` directly — there is no config prop. For reference, the routing shape is a pathless layout route:

```tsx
// src/App.tsx (already wired)
const router = createBrowserRouter([
  {
    element: (
      <RootLayout>
        <Outlet />
      </RootLayout>
    ),
    children: routes,
  },
]);
```

Pages become simple content components:

```tsx
// src/pages/home.tsx
export default function HomePage() {
  return <div>Your content here</div>;
}
```

**Available Layouts**:

- **RootLayout** (`src/layouts/RootLayout.tsx`) - Centralized header/footer wrapper
- **Website** (`src/layouts/Website.tsx`) - Structural container (used by RootLayout)
- **Dashboard** (`src/layouts/Dashboard.tsx`) - Admin panels and dashboards

See `src/layouts/*.md` for detailed usage documentation.

## 🧪 Testing

Run tests with:

```bash
npm run test
```

The template includes:

- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Jest DOM** - Custom Jest matchers

## 📦 Deployment

### Build for production:

```bash
npm run build
```

### Deploy to Vercel

This repository includes `vercel.json` and `api/index.ts` so Vercel can run the
Express SSR server as a function. Browser routes, API routes, sitemap/robots
output, and server-rendered metadata are preserved.

1. Import the repository into Vercel.
2. Set the Node.js version to 22 or later.
3. Add the production environment variables from `env.example` in the Vercel
  project settings. Keep secret values server-only and do not prefix them with
  `VITE_`.
4. Deploy. Vercel uses `npm run build`; no start command is required.

For a local production check, run `npm run build` and then `npm run preview`.

### Other deploy options:

- **Railway/Render** - Full-stack deployment
- **Docker** - Containerized deployment

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
VITE_APP_NAME=v8 App Template
VITE_PUBLIC_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
NODE_ENV=development
PORT=3000
VITE_ENABLE_SOURCE_MAPPING=true
VITE_ENABLE_SSR=true
VITE_SHOW_DEV_TOOLS=false
```

### Custom Plugins

**Source Mapper Plugin**: Adds component introspection for AI tools
**Dev Tools Plugin**: Enables development mode enhancements
**Fullstory Integration**: Optional user analytics (configurable)

Configure in `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sourceMapperPlugin from "./source-mapper/src/index";
import { devToolsPlugin } from "./dev-tools/src/vite-plugin";
import { fullStoryPlugin } from "./fullstory-plugin";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({ babel: { plugins: [sourceMapperPlugin] } }),
    ...(mode === "development" ? [devToolsPlugin(), fullStoryPlugin()] : []),
  ],
}));
```

## 🎯 Best Practices

### Component Architecture

- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic into hooks
- Prefer function components with hooks

### State Management

- Keep local state in components with useState/useReducer
- Use React Context for app-wide state (theme, auth)
- Consider external libraries (Zustand, Redux Toolkit) for complex state
- Leverage layout props for shared configuration

### Layout Usage

- Use RootLayout for multi-page sites (configure in `App.tsx`)
- Pages should only contain content, not layout concerns
- Define header/footer once, applies to all pages
- Follow layout documentation in `src/layouts/*.md`
- Never duplicate header/footer config across pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Run linting and tests
6. Submit a pull request

## 📄 License

MIT License - feel free to use this template for any project.

## 🙏 Acknowledgments

Built with amazing open-source tools:

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Vitest](https://vitest.dev/)

---

**Happy coding! 🎉**
