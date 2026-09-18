# Emi & Mark — Full AI RP Project

Complete Vercel project with:

- AI roleplay chat
- Full Emi / Mark canon story
- Slow-burn relationship system
- Daniel, Mia, Ryan side characters
- Photo upload so Emi can see images
- Scene image generation
- Gift system with relationship bonuses
- Browser save using localStorage + IndexedDB
- Fixed Scene dialog buttons

## Important bug fix

The Scene dialog's X and Cancel buttons are explicitly `type="button"`.

Only:

`generateSceneBtn`

can submit the Scene form. `app.js` also checks `event.submitter` as a second safety layer.

## GitHub structure

Upload these files exactly:

```text
RP-Emi/
├── api/
│   ├── chat.js
│   └── scene-image.js
├── app.js
├── index.html
├── style.css
├── package.json
├── vercel.json
└── .env.example
```

## Vercel environment variables

Required:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
```

Image generation:

```text
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_QUALITY=high
```

You may use `low`, `medium`, `high`, or another supported quality for your image model.

Do not put your real API key in GitHub.

## After uploading

1. Commit to `main`.
2. Wait for Vercel to redeploy.
3. Hard refresh the website with Ctrl+Shift+R.
4. Click New Story once if an older browser save is still loaded.
