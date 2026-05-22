# App Business Rules & Scoring Logic Specification

## 1. Prediction Lock Logic (Match Lock Rule)
- The frontend client must dynamically compare the user's current system time (`Date.now()`) with the match's `start_time` fetched from the database.
- **Rule:** Lock all inputs and the "Save Prediction" button exactly **15 minutes before** the match kickoff time.
- If the current time is within the 15-minute window, past the kickoff time, or the match `status` is 'FINISHED', display a lock icon 🔒 and disable editing.

## 2. Scoring System Matrix (Scoring Rules)
When the Admin updates the actual match scores (`score_a`, `score_b`) and marks the status as 'FINISHED', points are automatically distributed as follows:
- **Exact Score Match:** +3 points. (e.g., Prediction: 2-1, Result: 2-1).
- **Correct Winner & Exact Goal Difference:** +2 points. (e.g., Prediction: 3-1, Result: 2-0 -> Both reflect a +2 goal gap for Team A).
- **Correct Outcome Only (Winner or Draw with wrong gap):** +1 point. (e.g., Prediction: 3-0, Result: 1-0 -> Team A won, but score/gap is wrong).
- **Wrong Outcome:** 0 points.

### Knockout Phase Multipliers:
- Group Stage & Round of 32: Base points (X1 multiplier).
- Round of 16, Quarter-finals & Semi-finals: **Double Points (X2 multiplier)** -> Applies to Match IDs 73 to 102.
- Third-place Match & Grand Final: **Triple Points (X3 multiplier)** -> Applies to Match IDs 103 and 104.

## 3. Progressive Dinner Penalty Calculation
- **Top 1, Top 2, Top 3 (The Elite Group):** Pays 0 VND (Eats completely FREE).
- **The Absolute Last Place (Wooden Spoon):** Pays the absolute maximum capped ceiling of **500,000 VND**.
- **All other ranks (Rank 4 down to Second-to-Last):** Penalties are calculated dynamically based on point-distance ratio relative to the 3rd place and Last place using this exact mathematical formula:
  `Penalty = 500000 * (P_Top3 - P_User) / (P_Top3 - P_Last)`
  *(Where P_Top3 is the score of rank 3, P_Last is the score of the last place, and P_User is the targeted user's score)*
- **Champion's Immunity (Top 1 Privilege):** If the actual restaurant bill exceeds the total penalty funds pool aggregated by the app, the 1st place Champion remains **100% immune** to extra charges. The outstanding deficit will be split equally among all members from Rank 2 downwards.