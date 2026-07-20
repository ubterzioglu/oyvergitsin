# 🇹🇷 Turkey Political Alignment Platform --- Full MVP Infrastructure Spec

## 1. Project Overview

Build a production-ready, API-first political alignment platform using:

-   Next.js (latest, App Router, TypeScript)
-   Supabase (Postgres + Auth + Storage)
-   RBAC (admin, user)
-   Versioned ideological axis model
-   Scoring matrix engine
-   Admin panel
-   Survey engine supporting all major question types
-   Result engine (axis scores + party similarity)
-   Party color-based UI theming

This MVP builds infrastructure first. Real party program data will be
added later.

------------------------------------------------------------------------

# 2. Core Functional Requirements

## Public Flow

1.  Landing page\
2.  Consent page (mandatory, versioned)\
3.  Survey (25 questions in future; MVP seeds 1 of each type)\
4.  Results page:
    -   10-axis radar or chart
    -   Party similarity ranking (dummy positions for now)
    -   Short explanation: "You match X because..."
    -   Placeholder for party program excerpts (future)

------------------------------------------------------------------------

## Auth Modes

-   Guest session (anonymous)
-   Logged-in session (Supabase Auth)
-   Both create a session record
-   Admin role required for /admin

------------------------------------------------------------------------

# 3. Ideological Model

Initial version: axis_model_v1

### 10 Axes

1.  economy_market_state\
2.  income_distribution\
3.  civil_liberties\
4.  security_state\
5.  secularism\
6.  identity_migration\
7.  foreign_policy\
8.  eu_relations\
9.  education_social_policy\
10. environment_growth

All scores normalized to \[-100, +100\].

------------------------------------------------------------------------

# 4. Supported Question Types

System must support and seed one example of each:

single_choice\
multi_choice\
dropdown_single\
dropdown_multi\
ranking\
forced_choice_pair\
matrix_single\
matrix_multi\
likert_5\
likert_7\
slider_0\_100\
numeric_input\
allocation\
scenario_single\
scenario_multi\
vignette_likert\
open_text_short\
open_text_long\
image_choice_single\
image_choice_multi\
file_upload\
date_input\
consent_checkbox_group\
attention_check\
captcha_placeholder

------------------------------------------------------------------------

# 5. Scoring Engine

Each question answer maps to axes via scoring_rules.

Computation Flow: 1. Fetch session answers. 2. Apply scoring rules. 3.
Aggregate axis scores. 4. Normalize to \[-100, +100\]. 5. Compare with
party_positions. 6. Compute similarity percentage. 7. Store
result_snapshot.

------------------------------------------------------------------------

# 6. Database Schema

All tables use UUID primary keys and timestamps.

Tables:

roles\
user_roles\
consent_texts\
axis_models\
axes\
parties\
party_positions\
questions\
question_options\
scoring_rules\
sessions\
answers\
result_snapshots\
behavior_events

(See full SQL schema in system prompt specification.)

------------------------------------------------------------------------

# 7. API Endpoints

Public: POST /api/sessions\
GET /api/questions\
POST /api/answers\
POST /api/complete\
GET /api/results/:sessionId

Admin: CRUD for axes\
CRUD for questions\
CRUD for scoring_rules\
CRUD for parties\
CRUD for consent_texts\
GET analytics overview

------------------------------------------------------------------------

# 8. Admin Panel Pages

/admin\
/admin/axes\
/admin/questions\
/admin/scoring\
/admin/parties\
/admin/consent\
/admin/analytics

------------------------------------------------------------------------

# 9. Theme & Party Color System

Use the following palette in layout and result components:

#F7941D\
#E30A17\
#F2B705\
#0B1F3A\
#7A3DB8\
#2EAD4A\
#1B6FB3\
#6A1BB3\
#333333\
#D10F2F\
#0F7A3A\
#D61F26\
#F2C300\
#E31B23\
#00964C\
#FDD007\
#000000\
#FFFFFF

------------------------------------------------------------------------

# 10. Security

-   Hash IP
-   Store device hash
-   Risk scoring per session
-   RLS enabled
-   Admin-only access for system tables

------------------------------------------------------------------------

# 11. Phase 2 Expansion

-   Party program ingestion
-   Hybrid AI + manual scoring
-   Real-time political dashboard
-   Report export (PDF/CSV)
-   Advertising module
-   Data API access

------------------------------------------------------------------------

# Deliverables

AI agent must generate:

-   Next.js project
-   Supabase integration
-   Database schema + migrations
-   Seed script (axes + dummy parties + question types)
-   Working survey flow
-   Working scoring engine
-   Admin panel
-   README with setup instructions
