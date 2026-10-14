Student Finance Tracker: Spec (M1)

1. Overview
A vanilla HTML/CSS/JS app that helps students log spending, search it with regex, and stay under a budget cap. Accessible, mobile-first, and saved in localStorage. All amounts are in Rwandan francs (RWF) by default, with optional conversion to other currencies.
Sections: About, Dashboard, Records, Add/Edit Form, Settings
2. Data model
Record
Field	Type	Example	Rule
id	string	"txn_0001"	Unique, generated
description	string	"Lunch at cafeteria"	No leading/trailing spaces
amount	number	1500	0 or positive whole number (RWF has no decimals in everyday use)
category	string	"Food"	Letters, spaces, hyphens
date	string	"2025-09-29"	YYYY-MM-DD
createdAt	string	"2025-09-29T10:15:00.000Z"	ISO timestamp, set once
updatedAt	string	"2025-09-29T10:15:00.000Z"	ISO timestamp, changes on edit
Amounts are always stored in the base currency (RWF). Conversion to other currencies happens only when displaying.
Settings
Field	Example
baseCurrency	"RWF"
otherCurrencies	[{ code: "USD", rate: 1450 }, { code: "EUR", rate: 1680 }, { code: "KES", rate: 11.2 }, { code: "UGX", rate: 0.4 }]
cap	100000
categories	["Food", "Books", "Transport", "Airtime", "Fees", "Other"]
Rate convention: rate = how many RWF equal 1 unit of that currency. Example: USD: 1450 means 1 USD = 1,450 RWF. To convert an RWF amount to another currency: amountRWF / rate. To convert into RWF: amountOther * rate.
Note on rates: The rates above are illustrative placeholders. Before submission, replace them with current rates (for example from the National Bank of Rwanda) and note the date used.
Storage keys
•	sft:records: array of records
•	sft:settings: settings object
3. Wireframes (see also docs/sketches/)
Hand-drawn wireframes are photographed into docs/sketches/. The text versions below are a guide.
Mobile (~360px):
+--------------------+
| [Skip to content]  |
| Finance Tracker    |
| [=] Menu           |
+--------------------+
| DASHBOARD          |
| Total: 12 records  |
| Spent: RWF 24,550  |
| Top: Food          |
| [||| bar chart ]  |
| Cap: RWF 75,450    |
|      left          |
+--------------------+
| RECORDS            |
| [Search regex__]   |
| [x] Ignore case    |
| Sort: [Date v]     |
| +----------------+ |
| |Lunch RWF 1,500 | |
| |Food 09-25      | |
| |[Edit][Delete]  | |
| +----------------+ |
+--------------------+
Desktop (1024px+):
+----------------------------------------------+
| Finance Tracker  About Dashboard Records ... |
+----------------------------------------------+
| Stats cards (4 across)  |  7-day bar chart   |
+----------------------------------------------+
| Search [______] [x] case   Sort [v]          |
| Date | Description | Amount (RWF) | Category |
| rows...                                      |
+----------------------------------------------+
| Add/Edit form (2 columns)                    |
+----------------------------------------------+
4. Layout and breakpoints (mobile-first)
Width	Layout
Base (~360px)	One column, records as cards, nav collapsed
768px	Two-column form, stats in a 2x2 grid, table appears
1024px	Full table, nav as a horizontal bar, dashboard side by side
5. Validation rules
Field	Pattern
Description	^\S(?:.*\S)?$
Amount (whole RWF)	^(0|[1-9]\d*)$
Date	^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$
Category	^[A-Za-z]+(?:[ -][A-Za-z]+)*$
Advanced	\b(\w+)\s+\1\b (back-reference: flags repeated words)
Currency rate field (Settings): ^[1-9]\d*(\.\d{1,4})?$\|^0\.\d{1,4}$ (positive number, up to 4 decimals, so small rates like UGX 0.4 are allowed).
Currency formatting: display amounts with new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).
6. Accessibility plan
•	Skip-to-content link as the first focusable element
•	Landmarks: header, nav, main, footer; one h1, h2 per section
•	Every input has a <label for>; errors are linked with aria-describedby and aria-invalid
•	Visible :focus-visible outline (3px, high contrast)
•	Live regions: role="status" for save/delete/import messages; aria-live="polite" under the cap, aria-live="assertive" over it
•	Search highlights use <mark>, with text escaped before insertion
•	Contrast target: 4.5:1 for text, 3:1 for UI components (verify with WebAIM)
•	Respect prefers-reduced-motion
•	Keyboard-only flow: Tab through nav, search, sort, rows, and form; Enter/Space activate buttons; Esc closes the delete dialog
7. Keyboard flow (draft)
Key	Action
Tab / Shift+Tab	Move between controls
Enter / Space	Activate button, submit form
Esc	Cancel edit or close dialog
8. Module plan
File	Responsibility
storage.js	Load/save to localStorage, import/export
state.js	Records array, add/update/delete/get
validators.js	Regex rules, return error messages
search.js	Safe regex compile, highlight
currency.js	Format RWF amounts, convert to other currencies using RWF-based rates from settings
ui.js	Render table/cards, stats, messages
main.js	Wire events, start the app
Sync rule: this table must match the scripts/ folder exactly. See section 10.
9. Milestone plan
Milestone	Target day
M1 spec	Day 1
M2 HTML/CSS base	Day 1
M3 forms and regex	Day 1
M4 render, sort, search	Days 2
M5 stats and cap	Day 2
M6 persistence, import/export	Day 2
M7 polish, README, video	Day 2
  

