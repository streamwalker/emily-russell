

## PropertyEditor Enhancements + Add Properties for gomezurita@gmail.com

### Three items to implement

**1. Search/filter bar in PropertyEditor**

Add a search input at the top of PropertyEditor (next to the Smart Add button). It filters the visible properties in real-time by matching against `address`, `city`, `builder`, and `community` fields (case-insensitive). Tabs with zero matching properties are hidden. The filter state resets when cleared.

**2. Drag-and-drop reordering**

Install `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Wrap each tab's property list in a `SortableContext` with vertical sorting. Each property row becomes a draggable item with a grip handle. For cross-tab moves, use `DndContext` with an `onDragEnd` handler that detects when a property is dropped into a different tab's droppable area and moves it accordingly. Each tab section is also a droppable container.

**3. Add 4 properties to gomezurita@gmail.com's dossier**

This is a data task. After the code changes are made, use the Smart Add / parse-properties edge function (or direct database update) to add these addresses to the client's existing dossier:
- 9208 Carmel View, Schertz
- 2715 Clapbread Ln, Rosenberg TX
- 5815 Chamberlain Crossing, Rosenberg TX 77471
- 12309 Horowitz, San Antonio TX 78254

This requires looking up the dossier for gomezurita@gmail.com via profile → user_id → client_dossiers, then appending these properties.

### Files

| File | Action |
|------|--------|
| `package.json` | Add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `src/components/admin/PropertyEditor.tsx` | Add search bar, integrate dnd-kit drag-and-drop |
| Database script (runtime) | Query gomezurita dossier and add 4 properties via edge function or direct JSONB update |

### Technical Details

- **Search**: New `searchQuery` state, `filteredProperties` useMemo that filters `data.properties` per tab. Only the rendering loop changes — the underlying `data` state stays unfiltered so edits work correctly.
- **Drag-and-drop**: `DndContext` wraps the entire tab list. Each tab is a `useDroppable` container. Each property row uses `useSortable`. `onDragEnd` handles both intra-tab reorder (splice + insert) and cross-tab move (remove from source tab, insert into target tab).
- **Data addition**: Will query `profiles` for gomezurita@gmail.com to get `user_id`, then query `client_dossiers` for that user, and append the 4 properties (using the Smart Add AI extraction or manual JSONB append).

