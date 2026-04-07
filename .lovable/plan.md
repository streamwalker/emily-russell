

## Fix PDF Text Alignment on TRX-1501 Form

### Issues identified from the sample output

**Page 1:**
- "Associate: Emily Russell" has a redundant "Associate:" prefix — the form already implies this field

**Pages 2-6 header:**
- Client name drawn at x=288, but the "between" label text ends at x=249. Name should start at x=252, causing it to appear too far right on the header line

**Pages 1-5 footer initials:**
- Initials ("ER", "P.R.") appear BELOW the initials line instead of ON the blank spaces. Two issues:
  - y is wrong: currently `top=757` but the initials line is at `top=736.3` — initials render 20pt too low
  - x positions are wrong: "ER" at x=310 lands inside the printed text; should be at ~x=382 (the blank after "Broker/Associate"). Client initials at x=450 should be ~x=445, client2 at x=475

**Page 6 signature block — all fields overlap their labels:**
- Printed names drawn at `top≈234.6` which lands right ON the "Broker's Printed Name" / "Client's Printed Name" labels at `top=235`. Should be ~13pt higher (`top≈222`)
- Dates drawn at x=270 and x=548 collide with the "Date" label text (which starts at x=252 / x=540 and ends at x=273 / x=561), producing "Date4/7/2026". Dates should be positioned ABOVE the label line (`top≈254`) at x=252 and x=540
- Signature image too small (height=30) and positioned too low
- Broker associate printed name overlapping its label — needs to shift up to `top≈294`
- Second client name and date have the same overlap issues

### Changes to `supabase/functions/generate-agreement-pdf/index.ts`

**Page 1 — Associate line (line 84):**
- Remove the `Associate: ` prefix, just draw the name

**Pages 2-6 header (lines 106, 114):**
- Change x from `288` to `252`

**Footer initials loop (lines 119-131):**
- Change y from `y(745 + 12)` to `y(736)` (on the initials line)
- Change broker initials x from `310` to `382`
- Change client initials x from `450` to `445`
- Change client2 initials x from `510` to `475`

**Page 6 signature block (lines 133-190):**
- Printed names: change top from `224.6 + 10` (~234.6) to `222` for all three (broker name, license, client name)
- Dates: change top from `266.1 + 10` (~276) to `254`, and x positions to `252` (broker) and `540` (client)
- Signature image: increase height to `40`, adjust y to `y(260)`
- Broker associate name: change top from `297.0 + 10` to `294`
- Second client name: change top from `307.4 + 10` to `294`
- Second client signature date: change top from `348.8 + 10` to `336`, x to `540`
- Second client signature image y to `y(342)`

### Files

| File | Action |
|------|--------|
| `supabase/functions/generate-agreement-pdf/index.ts` | Edit — fix all coordinate misalignments |

