# Supabase Database Schema - World Cup 2026 Prediction App

## 1. Table: `matches`
Stores the official World Cup tournament schedule and live scores.
- `id`: integer (Primary Key, from 1 to 104)
- `team_a`: text NOT NULL (Name or knockout code for Team A)
- `team_b`: text NOT NULL (Name or knockout code for Team B)
- `start_time`: timestamp with time zone (ISO UTC format)
- `venue`: text (Stadium/City location)
- `score_a`: integer (Actual score of Team A, default: null)
- `score_b`: integer (Actual score of Team B, default: null)
- `status`: text (Default: 'UPCOMING', changes to 'FINISHED' once score is settled)

## 2. Table: `predictions`
Stores the match predictions submitted by each team member.
- `id`: uuid (Primary Key, auto-generated using `gen_random_uuid()`)
- `user_id`: uuid (Foreign Key linking to Supabase's internal `auth.users.id`)
- `match_id`: integer (Foreign Key linking to `matches.id`)
- `predicted_a`: integer NOT NULL (Predicted score for Team A)
- `predicted_b`: integer NOT NULL (Predicted score for Team B)
- `created_at`: timestamp with time zone (Default: `now()`)

### Row-Level Security (RLS) Requirements:
- Users are only allowed to INSERT/UPDATE/DELETE records where `auth.uid() = user_id`.
- Read access (SELECT) is public or restricted to authenticated team members so everyone can view other players' predictions after lock time.

## 3. Table: `profiles`
Stores user profile information.
- `user_id`: uuid (Primary Key, Foreign Key linking to `auth.users.id`)
- `username`: text (The unique name used for login/identification)
- `display_name`: text (Optional name shown on the leaderboard)
- `avatar_url`: text
- `is_admin`: boolean (Default: false)
- `created_at`: timestamp with time zone (Default: `now()`)
- `updated_at`: timestamp with time zone (Default: `now()`)

## 4. Table: `user_totals`
Stores the aggregated prediction scores/points for users.
- `user_id`: uuid (Primary Key, Foreign Key linking to `auth.users.id`)
- `total`: integer (Default: 0)