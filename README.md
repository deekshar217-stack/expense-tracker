# Spendly — AI-Assisted Expense Tracker

A responsive React expense tracker based on the requirements in the supplied **Program 05 – AI-Assisted Expense Tracker** lab PDF.

## Features

- Add expenses with amount, category, date and optional note.
- Validation: amount must be greater than zero, category is required, note is limited to 120 characters.
- Expense list sorted newest first, with category labels and delete confirmation.
- Add, rename, recolour and delete custom categories. A category cannot be deleted while expenses use it.
- Save expenses and categories in browser `localStorage`.
- Monthly total, comparison with the previous month, category breakdown and six-month spending trend.
- Export all expenses as a CSV file.
- Responsive layout for desktop and mobile.

## Run in VS Code

1. Extract the ZIP file.
2. Open the extracted `ai-assisted-expense-tracker` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL shown in the terminal (usually `http://localhost:5173`).

You need Node.js LTS installed. If `npm` is not recognised, install Node.js from https://nodejs.org/ and restart VS Code.

## Build check

```bash
npm run build
```

Vite creates the production website in the `dist` folder.

## Publish a public website using GitHub Pages

1. Sign in to GitHub and create a **new public repository** (for example `expense-tracker`).
2. Extract the ZIP and open the project folder in VS Code.
3. In the VS Code terminal, run these commands from the project folder:

   ```bash
   git init
   git add .
   git commit -m "Create expense tracker"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/expense-tracker.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` and `expense-tracker` with your actual GitHub username and repository name.

4. In the GitHub repository, open **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions**.
6. In VS Code, create `.github/workflows/deploy.yml` (the ZIP already includes it), commit and push if you created it after the first push.
7. Open the repository's **Actions** tab and wait for the Pages workflow to finish with a green check.
8. Go to **Settings → Pages** to find your public URL. It will usually look like:

   `https://YOUR-USERNAME.github.io/expense-tracker/`

   The site may take a few minutes to become available.

### Updating the website

Edit files in VS Code, then run:

```bash
git add .
git commit -m "Update expense tracker"
git push
```

GitHub Actions will publish the update automatically.

## Important notes

- Expense data is stored in the browser's `localStorage` on each visitor's device. It is not shared between visitors and is not uploaded to a server.
- If a visitor clears browser data or changes browser/device, their saved expenses may not be available.
- This project is a client-side learning project; it does not include user accounts, cloud sync or a backend database.
- The project uses React and Vite. Charts are drawn with native SVG/CSS, so no chart API or external service is required.

## Project structure

```text
ai-assisted-expense-tracker/
├── .github/workflows/deploy.yml
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    └── styles.css
```
