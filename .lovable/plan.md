

## Reusable Dossier Template Library

### Summary

Add a new `dossier_templates` table and a "Templates" tab in the Admin Dashboard where admins can save, name, edit, and delete reusable templates. Templates are standalone dossier data structures not tied to any client. The existing "Load Template" dropdown in the new dossier form will pull from this library instead of (or in addition to) existing client dossiers.

### Database

**New table: `dossier_templates`**

```sql
CREATE TABLE public.dossier_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  dossier_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dossier_templates ENABLE ROW LEVEL SECURITY;

-- Admin-only CRUD
CREATE POLICY "Admins can manage templates" ON public.dossier_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Frontend Changes

**1. AdminDashboard.tsx**

- Add a 4th tab: "Templates" (with a `FileText` icon) alongside Dossiers, Analytics, Engagement
- **Templates tab content**:
  - List all templates (name, description, property count, last updated)
  - "Save as Template" button on each existing client dossier row — copies the dossier_data into a new template with a name prompt
  - "+ New Template" button — opens a form with name, description, and the same smart input / PropertyEditor / raw JSON workflow used for dossier creation
  - Edit button — opens template in PropertyEditor for modification
  - Delete button with confirmation
- **New Dossier form** — update the "Load Template" dropdown to show templates from `dossier_templates` in a separate optgroup labeled "Templates", above the existing client dossiers group

**2. No other files need changes** — PropertyEditor already supports standalone use with `dossierData` + `onSave` props.

### Files

| File | Action |
|------|--------|
| Database migration | Create `dossier_templates` table with RLS |
| `src/pages/AdminDashboard.tsx` | Add Templates tab, save-as-template on dossier rows, update template dropdown in new dossier form |

