

## Add Favorites, Tour Scheduling, Comments & Grading to Dossier Properties

### Summary

Three new client-facing features on each property card: (1) favorite/heart toggle, (2) preferred tour day/time input, and (3) a comments section with letter grading. All data persists per-user per-property in a new database table. Grade limits (max 3 each for A+, A, A-) are enforced client-side.

### Database

New table `property_interactions` to store all three features in one row per user+property:

```sql
CREATE TABLE public.property_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id TEXT NOT NULL,
  dossier_id UUID,
  is_favorite BOOLEAN DEFAULT false,
  preferred_tour_date DATE,
  preferred_tour_time TEXT,
  comments TEXT,
  grade TEXT, -- 'A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','F-'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, property_id)
);
```

RLS: users can CRUD their own rows; admins can read all.

### Frontend Changes (`ClientPortal.tsx`)

**1. Favorites**
- Heart icon button on each property row header (next to the Compare checkbox)
- Filled red heart = favorited; outline = not
- Clicking toggles `is_favorite` in `property_interactions` via upsert

**2. Tour Day/Time**
- In the expanded property detail area, add a small section: "When would you like to see this home?"
- Date picker (using Shadcn Calendar/Popover) + time input (text, e.g. "10:00 AM")
- Auto-saves on change via upsert

**3. Comments & Grading**
- In the expanded property detail area, below Agent Notes, add "Your Feedback" section
- Textarea for comments
- Dropdown/select for grade (A+ through F-)
- Grade validation: when selecting A+, A, or A-, check how many other properties already have that grade. If >= 3, show toast error and reject
- Auto-save with debounce (or explicit "Save" button)

**Data flow:**
- On page load, fetch all `property_interactions` for the current user in one query
- Store in a `Record<propertyId, Interaction>` state map
- Each interaction update does an upsert to `property_interactions`
- Favorites count shown in a small badge on the header (e.g. "❤ 5 Favorites")

### Files

| File | Action |
|------|--------|
| Database migration | Create `property_interactions` table with RLS |
| `src/pages/ClientPortal.tsx` | Add favorites, tour scheduling, comments/grading UI; fetch/save interactions |

