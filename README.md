# Öy Ver Gitsin - Türkiye Siyasi Eşleşme Platformu

Full MVP infrastructure for a production-ready political alignment platform using Next.js, Supabase, and TypeScript.

## Features

- **Public Survey Flow**: Landing page → Consent → Survey → Results
- **10 Ideological Axes**: Economy, Security, Secularism, etc.
- **Scoring Engine**: Calculate political alignment with parties
- **Admin Panel**: Manage axes, questions, parties, and consent texts
- **Party Color Theming**: Turkish political party colors
- **RBAC**: Admin and user roles
- **25 Question Types**: From single choice to file upload

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Supabase (Postgres, Auth, Storage)
- Tailwind CSS
- Recharts (Data visualization)
- Zustand (State management)

## Setup

### Prerequisites

- Node.js 18+
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at https://supabase.com
   - Go to Project Settings → API
   - Copy your project URL and anon key

4. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Initialize Supabase locally:
```bash
npx supabase init
```

6. Link to your Supabase project:
```bash
npx supabase link --project-ref your_project_id
```

7. Push the database schema:
```bash
npx supabase db push
```

8. Seed the database:
```bash
npm run db:seed
```

9. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── consent/           # Consent page
│   ├── results/           # Results page
│   ├── survey/            # Survey page
│   └── page.tsx           # Landing page
├── lib/
│   ├── scoring/           # Scoring engine
│   └── supabase/          # Supabase client
├── scripts/
│   └── seed.js            # Database seed script
└── supabase/
    └── migrations/        # Database migrations
```

## Database Schema

The following tables are created:

- `roles` - User roles (admin, user)
- `user_roles` - User-role assignments
- `consent_texts` - Versioned consent texts
- `axis_models` - Ideological axis models
- `axes` - Political axes (10 axes)
- `parties` - Political parties
- `party_positions` - Party positions on axes
- `questions` - Survey questions
- `question_options` - Question options
- `scoring_rules` - Answer-to-axis scoring rules
- `sessions` - User sessions
- `answers` - User answers
- `result_snapshots` - Calculated results
- `behavior_events` - User behavior tracking

## API Endpoints

### Public
- `POST /api/sessions` - Create a new session
- `GET /api/questions` - Get all questions
- `POST /api/answers` - Submit answers
- `POST /api/complete` - Complete survey and calculate results
- `GET /api/results/:sessionId` - Get results for a session

### Admin
- Admin panel at `/admin` for managing:
  - Axes (`/admin/axes`)
  - Questions (`/admin/questions`)
  - Parties (`/admin/parties`)
  - Consent texts (`/admin/consent`)

## Scoring Engine

The scoring engine:
1. Fetches user answers
2. Applies scoring rules
3. Aggregates axis scores
4. Normalizes to [-100, 100]
5. Compares with party positions
6. Computes similarity percentage
7. Stores result snapshot

## Party Colors

The platform uses Turkish political party colors:
- AKP: #F7941D
- CHP: #E30A17
- MHP: #F2B705
- İYİ: #0B1F3A
- DEVA: #7A3DB8
- Gelecek: #1B6FB3
- Saadet: #6A1BB3
- TİP: #333333
- Vatan: #D10F2F
- YSP: #0F7A3A
- Zafer: #00964C
- Memleket: #FDD007

## Question Types Supported

All 25 question types from the spec are supported:
- single_choice, multi_choice
- dropdown_single, dropdown_multi
- ranking, forced_choice_pair
- matrix_single, matrix_multi
- likert_5, likert_7
- slider_0_100, numeric_input
- allocation, scenario_single, scenario_multi
- vignette_likert
- open_text_short, open_text_long
- image_choice_single, image_choice_multi
- file_upload, date_input
- consent_checkbox_group
- attention_check
- captcha_placeholder

## Security

- Row Level Security (RLS) enabled
- IP hashing for anonymous users
- Device fingerprinting
- Risk scoring per session
- Admin-only access for system tables

## Future Enhancements

- Party program ingestion
- Hybrid AI + manual scoring
- Real-time political dashboard
- Report export (PDF/CSV)
- Advertising module
- Data API access

## License

MIT
