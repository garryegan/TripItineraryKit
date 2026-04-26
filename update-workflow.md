# TripItineraryKit — Update Workflow Guide

This document describes the exact workflow for updating the TripItineraryKit project and deploying changes to Cloudflare Pages.

---

## 1. Edit Files Locally (Windows 11)

All updates begin in your local project folder:

C:\Projects\TripItineraryKit\

Modify any project files as needed (JSON, Svelte, UI, logic). Save your changes.

---

## 2. Test Locally

Development mode:
npm run dev
View at: http://localhost:5173/

Production preview:
npm run build
npm run preview
View at: http://localhost:4173/

---

## 3. Stage Changes

Prepare all modified files for committing:
git add .

---

## 4. Commit Changes

Create a versioned snapshot:
git commit -m "Describe your change here"

Examples:
"Add Budva restaurant to balkans-2026.json"
"Fix Leaflet marker icons"

---

## 5. Push to GitHub

Upload your commit:
git push

This triggers Cloudflare Pages to rebuild your site.

---

## 6. Cloudflare Automatic Deployment

Cloudflare runs:
npm install
npm run build

A new global deployment is created automatically.

---

## 7. Verify Live Deployment

Your updated site appears at:
https://tripitinerarykit.pages.dev/

After DNS migration:
https://trip.egan.id.au/

---

## 8. Summary

Edit → Test → git add → git commit → git push → Cloudflare rebuilds → Live
