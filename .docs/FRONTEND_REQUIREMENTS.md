# Frontend UI/UX Design & Architecture Requirements

## 1. Design System & Theming
- **Target:** Mobile-first responsive design layout (looks crisp on smartphones and desktops).
- **Vibe:** Sleek, modern sports-dashboard aesthetic.
- **Color Palette:** Primary Dark Navy (for structure), Clean Snow White (for content blocks), and Accent Metallic Gold (for CTAs, active highlights, and Top 1 celebration UI).

## 2. Application Flow & Screen Blueprints

### Screen 1: Authentication (Login/Signup)
- Minimalist splash login. Integration with Supabase Auth (supports fast Google OAuth Sign-In or corporate email/password).

### Screen 2: Fixtures & Prediction Dashboard
- Renders the scrollable feed of the 104 matches ordered chronologically.
- **CRITICAL:** Frontend must localize the UTC `start_time` into the user's local timezone.
- Filters tab: "All Matches", "Upcoming", "Finished", "My Predictions".
- Each match component includes: Team flags/names, localized time, venue name, two numeric inputs for scores, a "Save" status button, and the final actual score (revealed once finished).

### Screen 3: Realtime Leaderboard
- A live scoreboard sorting team members dynamically from highest to lowest total score.
- Row data: Rank, Avatar (from Google Auth profile), Display Name, Total Points, and **Current Penalty Fine (calculated in real-time via the business rule formula)**.
- Visual Badges: Gold/Silver indicators for Top 3 ("The Elite"), and a clown 🤡/warning icon for the current Last Place ("Golden Sponsor").

### Screen 4: Admin Panel (Restricted Access)
- Simple dashboard accessible only to authorized admin accounts.
- Allows inputting actual scores for active matches and a button to trigger the match settlement (which recalculates users' total scores and progressive penalties).