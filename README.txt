Westamericanbank - Prototype Demo Website
=========================================
This folder contains a static, educational demo of a banking dashboard (Westamericanbank).
**Important:** This is a prototype and NOT a real bank. Do not enter real credentials.

Files:
- index.html      : Main site (login, dashboard, send money simulation)
- styles.css      : Stylesheet
- app.js          : Client-side JS (loads transactions.csv, simulates send failures, chat)
- transactions.csv: 60 days of demo transactions (newest-first). Includes a Department of Defense wire.
- compute_running.js : Node script to compute running balances and output transactions_with_running.csv

How to test locally:
1. Serve the folder with a simple static server (to allow fetch of CSV):
   - Python 3: python -m http.server 8000
   - Node: npx http-server -p 8000
2. Open http://localhost:8000 in your browser.
3. Click 'Use demo account' to view the dashboard.
4. Try 'Send' — transfers always fail (prototype) and will show email preview + open Customer Care chat.

Deploy:
- Upload these files to a GitHub repo and deploy to Vercel or Netlify as a static site.

Security & compliance:
- Keep the prototype banner intact if you publish the site publicly to avoid impersonation risk.
