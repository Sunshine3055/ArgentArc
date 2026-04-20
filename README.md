# ArgentArc split App.jsx files

This folder contains a split version of the large `src/App.jsx` from your uploaded app.

## Included files

- `src/App.jsx` — slim app shell and routing
- `src/constants.js`
- `src/lib/supabase.js`
- `src/utils/helpers.js`
- `src/utils/exporters.js`
- `src/components/ui.js`
- `src/components/common.jsx`
- `src/components/AuthPanel.jsx`
- `src/components/AppShell.jsx`
- `src/views/DashboardView.jsx`
- `src/views/CasesView.jsx`
- `src/views/NewMemberHub.jsx`
- `src/views/SmdBaseView.jsx`
- `src/views/TrainingView.jsx`

## How to use

1. Back up your current `src` folder.
2. Copy these files into your project `src` folder.
3. Make sure your existing `main.jsx` still imports `./App.jsx`.
4. Run `npm run dev` locally.
5. If it works, commit and deploy.

## Notes

- This keeps the onboarding workflow, step completion, and SMD transfer behavior.
- It also keeps editable fields in New Member Hub and SMD Base.
- You may still want to keep your original CSS and any other project files unchanged.
