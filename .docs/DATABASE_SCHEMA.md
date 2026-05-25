# Supabase Database Schema - World Cup 2026 Prediction App

## 1. Table: `teams`
Stores information about the participating national teams.
- `id`: serial (Primary Key)
- `name`: text NOT NULL (e.g., 'Vietnam', 'Argentina')
- `group`: text NOT NULL (A, B, C, D, E, F, G, H, I, J, K, or L)
- `flag_code`: text (ISO code or identifier for flag icons)

## 2. Table: `matches`
Stores the official World Cup tournament schedule and live scores.
- `id`: integer (Primary Key, from 1 to 104)
- `stage`: text NOT NULL (e.g., 'GROUP', 'R32', 'R16', 'QF', 'SF', '3RD', 'FINAL')
- `group_label`: text (A-L, NULL for knockouts)
- `team_a`: text (Display name or placeholder like '1A', 'Winner Match 49')
- `team_b`: text (Display name or placeholder)
- `team_a_id`: integer (Foreign Key to `teams.id`, NULL for upcoming knockouts)
- `team_b_id`: integer (Foreign Key to `teams.id`, NULL for upcoming knockouts)
- `start_time`: timestamp with time zone (ISO UTC format)
- `venue`: text (Stadium/City location)
- `score_a`: integer (Actual score of Team A, default: null)
- `score_b`: integer (Actual score of Team B, default: null)
- `status`: text (Default: 'UPCOMING', changes to 'FINISHED' once score is settled)

## 3. Table: `predictions`
Stores the match predictions submitted by each team member.
- `id`: uuid (Primary Key, auto-generated using `gen_random_uuid()`)
- `user_id`: uuid (Foreign Key linking to Supabase's internal `auth.users.id`)
- `match_id`: integer (Foreign Key linking to `matches.id`)
- `predicted_a`: integer NOT NULL (Predicted score for Team A)
- `predicted_b`: integer NOT NULL (Predicted score for Team B)
- `created_at`: timestamp with time zone (Default: `now()`)

### Row-Level Security (RLS) Requirements:
- Users are only allowed to INSERT/UPDATE/DELETE records where `auth.uid() = user_id`.
- Read access (SELECT) is public or restricted to authenticated team members.

## 4. Table: `profiles`
Stores user profile information.
- `user_id`: uuid (Primary Key, Foreign Key linking to `auth.users.id`)
- `username`: text (The unique name used for login/identification)
- `display_name`: text (Optional name shown on the leaderboard)
- `avatar_url`: text
- `is_admin`: boolean (Default: false)
- `is_deleted`: boolean (Default: false)
- `deletion_requested_at`: timestamp with time zone
- `created_at`: timestamp with time zone (Default: `now()`)
- `updated_at`: timestamp with time zone (Default: `now()`)

## 5. Table: `user_totals`
Stores the aggregated prediction scores/points for users.
- `user_id`: uuid (Primary Key, Foreign Key linking to `auth.users.id`)
- `total`: integer (Default: 0)

## 6. Standing Calculation Logic (FIFA 2026 Rules)
Standings for each group (A-L) are calculated dynamically from `matches` where `status = 'FINISHED'` and `stage = 'GROUP'`.
Ranking Criteria:
1. Total Points (3 Win, 1 Draw, 0 Loss)
2. Overall Goal Difference
3. Overall Goals Scored
4. Head-to-head Points
5. Head-to-head Goal Difference
6. Head-to-head Goals Scored
7. (Optional) Fair Play points / Drawing of lots

**Knockout Propagation:**
When a group's matches are all finished, the system (triggered by Admin) updates the `team_a_id` or `team_b_id` of the corresponding knockout matches in the `matches` table based on the rank (1st, 2nd, and 8 best 3rd places).
