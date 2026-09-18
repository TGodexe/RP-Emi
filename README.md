# Emi & Mark — Interactive RP

A static interactive roleplay website for GitHub Pages.

## Features

- Mark / Emi chat interface
- Daniel, Mia, and Ryan side characters
- Hidden affection system (0–100)
- Slow-burn relationship stages
- Dialogue choices
- Save / reset with browser localStorage
- Mobile-friendly UI
- No backend required

## Run locally

Open `index.html` in your browser.

For best results, use a simple local server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.

GitHub will provide your public URL.

## Customize

Edit the character logic inside `script.js`, especially `emiReply()` and `maybeTriggerSideCharacter()`.

The affection thresholds are:

- 0–14: Best Friend
- 15–29: Curious
- 30–44: Questioning
- 45–64: Growing Feelings
- 65–84: Romantic Tension
- 85–100: Love Route
