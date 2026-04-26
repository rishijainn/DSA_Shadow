# 🎯 DSA Shadow: Project Architecture & Flow

This document outlines the end-to-end technical flow of the DSA Shadow system, detailing the user journey from onboarding to long-term memory mastery.

---

## 1. Onboarding & Configuration
**Files:**
- `app/login/page.tsx`: Handles user authentication via Supabase.
- `app/onboarding/page.tsx`: Collects user preferences (Daily Commitment, Level).
- `app/api/onboarding/route.ts`: Saves settings to the database.

**The Flow:**
1. User logs in/signs up.
2. User is redirected to **Onboarding**.
3. User selects a **Daily Commitment** (e.g., 3 problems/day) and their **Current Level**.
4. Data is stored in the `user_settings` table.

---

## 2. The Spaced Repetition Loop (Dashboard)
**Files:**
- `app/dashboard/page.tsx`: The main container for the user experience.
- `app/dashboard/Overview.tsx`: Displays the **Pending Queue** and consistency metrics.
- `app/api/review-schedule/route.ts`: The "Brain" that decides which problems appear today.

**The Flow:**
1. When the dashboard loads, it calls `/api/review-schedule`.
2. The API fetches all problems from `problem_scores` where the `next_review_date` is today or earlier (overdue).
3. **Rollover Capping:** It checks the user's `daily_commitment`. If the user has a limit of 3 but has 10 overdue, it only shows the 3 most urgent ones.
4. The user clicks a problem in the list, which opens it directly on LeetCode.

---

## 3. Submission Tracking (Browser Extension)
**Files:**
- `extension/content.js`: Injects logic into LeetCode; detects the "Accepted" state.
- `extension/popup.html`: The UI that appears after a solve.
- `app/api/log-submission/route.ts`: Processes the results and updates the SRS model.

**The Flow:**
1. The **Content Script** watches the LeetCode DOM for a successful submission.
2. Once "Accepted" appears, it triggers a custom popup in the browser.
3. The user inputs their **Difficulty Feel** (Easy, Med, Hard, Forgot) and whether they used a **Hint**.
4. The data is sent to `/api/log-submission`.
5. **FSRS Logic:** The API updates the problem's `stability` and `retrievability`:
   - **Solving (Clean):** Boosts stability, pushing the next review further away.
   - **Hints:** Applies a stability penalty.
   - **Forgot:** Resets stability and schedules an immediate review.
6. The `problem_scores` table is updated with a new `next_review_date`.

---

## 4. Mastery & Analytics
**Files:**
- `app/dashboard/MasteryInsights.tsx`: Visualizes topic-specific retention.
- `app/api/topic-mastery/route.ts`: Aggregates scores across LeetCode patterns.
- `lib/streak.ts`: Logic for the "True Streak" calculation.

**The Flow:**
1. The system calculates **Topic Strength** by averaging the retrievability of all problems within a category (e.g., "Two Pointers").
2. **Streak Tracking:** The system checks `daily_activity_summary`. If a user misses a day with 0 reviews due, the streak persists. If they miss a day with pending reviews, it resets.
3. **Explicit Skip:** If a user uses the `Skip` button in the dashboard, `/api/skip-review/route.ts` is called, which applies a 20% stability penalty and moves the problem to tomorrow.

---

## 5. Core Data Schema (Fields)

### `user_settings`
- `daily_commitment`: Max reviews per day.
- `current_level`: Beginner/Intermediate/Advanced.
- `leetcode_username`: Used for initial data syncing.

### `problem_scores`
- `stability`: Number of days the memory is expected to last.
- `retrievability`: % probability of recalling the problem today.
- `next_review_date`: Timestamp for the next scheduled solve.
- `total_solved`: Total lifetime attempts.
- `hint_count`: Number of times the user solved using AI/Hints.

### `daily_activity_summary`
- `reviews_due`: Total workload assigned that day.
- `reviews_solved`: How many of the due items were actually completed.
- `streak`: The current consecutive daily count.
