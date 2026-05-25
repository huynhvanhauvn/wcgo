# Security & Row-Level Security (RLS) Policies

This document outlines the security architecture and Supabase RLS policies required to protect the integrity of the World Cup 2026 Prediction App.

## 1. Global Principles
- **Authentication**: All users must be authenticated via Supabase Auth to submit predictions.
- **Client-Side vs Server-Side**: Frontend checks (e.g., `isAdmin` state) are for UI/UX only. All critical operations must be validated on the backend via RLS or Database Functions (RPC).

## 2. Table: `profiles`
- **SELECT**: Authenticated users can read all profiles (to show names on the Leaderboard).
- **INSERT/UPDATE**: Users can only modify their own profile (`auth.uid() = user_id`).
- **DELETE**: Restricted to Admins (or handled via `is_deleted` flag).
- **Admin Column Protection**: The `is_admin` column MUST NOT be updateable by the user through a standard `upsert`. This is protected by a database trigger or restricted RLS.

## 3. Table: `predictions`
- **SELECT**:
    - Users can always see their own predictions.
    - Users can ONLY see other people's predictions AFTER the match `lock_time` (kickoff - 15 mins) to prevent copying.
- **INSERT/UPDATE**:
    - Only allowed if `auth.uid() = user_id`.
    - Only allowed if the current time is BEFORE the match `lock_time`.
- **DELETE**: Not allowed once submitted.

## 4. Table: `matches`
- **SELECT**: Public/Authenticated (Read-only).
- **UPDATE/INSERT/DELETE**: Restricted to **Admin only**. Admin status is verified via the `profiles` table.

## 5. Table: `teams`
- **SELECT**: Public/Authenticated (Read-only).
- **UPDATE/INSERT/DELETE**: Restricted to **Admin only**.

## 6. Table: `user_totals` & `match_points`
- **SELECT**: Authenticated (Read-only).
- **INSERT/UPDATE/DELETE**: Handled exclusively by the `settle_match` RPC function. Manual manipulation by users is forbidden via RLS.

## 7. Database Functions (RPC)
- `settle_match`: Must check if the executing user is an Admin (`SELECT is_admin FROM profiles WHERE user_id = auth.uid()`).
- `reset_match`: Must check for Admin status.
- `delete_user_by_admin`: Must check for Admin status.

## 8. Frontend Security Checklist
- [x] No sensitive tokens or keys in `console.log`.
- [x] Console logs disabled in production.
- [x] All "Admin" routes protected by `isAdmin` state.
- [ ] Implement `lock_time` validation in `src/lib/api.ts` before calling Supabase to reduce failed requests.
