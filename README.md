# Legal Licence Dashboard

A modern, responsive dashboard for legal and compliance teams to manage hospital obligations across:

- Licences
- Renewals
- Permits
- Statutory filings
- Legal certificates

## What is included

- Hospital-first workflow: create hospital profile, then add one or more licenses
- Hospital profile fields: name, address, contact person, compliance owner
- License fields: licence name, category, issue date, expiry date, owner, regulator, status
- Renewal intelligence: date countdown, 3-month reminder, 15-day reminder, urgency level
- Hospital and category filtering
- Inline updates for category, expiry date, owner, and status
- Modal updates for complete license details
- Browser persistence using localStorage
- Excel (.xlsx) export of current filtered hospital/license view
- Action queue and milestones driven by nearest expiries

## Tech stack

- React
- TypeScript
- Vite

## Project structure

The codebase is organized in a feature-first layout with CSS Modules:

```text
src/
	app/
		AppRoot.tsx
	features/
		auth/
			components/
				LoginPage.tsx
				LoginPage.module.css
			hooks/
				useAuth.ts
		dashboard/
			components/
				DashboardPage.tsx
				DashboardPage.module.css
			hooks/
				useDashboardState.ts
		licenses/
			data/
				seed.ts
			utils/
				migrateLegacy.ts
				renewal.ts
	shared/
		constants/
			storageKeys.ts
		hooks/
			useTheme.ts
		styles/
			tokens.css
		types/
			domain.ts
		utils/
			date.ts
			exportExcel.ts
			id.ts
	App.tsx
	index.css
	main.tsx
```

## Notes

- `App.tsx` is now a thin shell that renders the app root.
- UI styles are component-scoped (CSS Modules) instead of a single monolithic stylesheet.
- Shared tokens/theme variables are centralized in `src/shared/styles/tokens.css`.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Google Sheets Integration

This project can sync hospitals/licenses with a deployed Google Apps Script Web App.

### 1. Configure environment variable

Create `.env.local` in project root:

```bash
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Then restart the Vite dev server.

### 2. Apps Script code

Use the script in [apps-script/Code.gs](apps-script/Code.gs). It supports:

- `GET ?action=list` -> `{ hospitals, licenses }`
- `POST { action: 'upsertLicense', payload }`
- `POST { action: 'upsertHospitalWithLicenses', payload }`

### 3. Required sheet tabs and headers

Create these tabs in the bound spreadsheet:

1. `Hospitals`
2. `Licences`

Required headers:

- Hospitals: `id,name,address,contactPerson,complianceOwner`
- Licences: `id,hospitalId,licenceName,category,issueDate,expiryDate,owner,regulator,status`

### 4. Deploy Apps Script as web app

1. Deploy -> New deployment -> Web app
2. Execute as: `Me`
3. Who has access: `Anyone` (or your preferred scope)
4. Copy `/exec` URL into `VITE_APPS_SCRIPT_URL`
