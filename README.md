# Emi & Mark — ChatGPT Scene Prompt Version

This version keeps AI chat for Emi, but removes the OpenAI Images API completely.

## Scene workflow

Press:

`🖼️ Scene`

The website automatically builds an image prompt from:
- current story state
- current relationship level
- recent dialogue
- Emi's appearance
- Mark's appearance
- your optional visual direction

Then:

1. Press **Copy Prompt**
2. Press **Open ChatGPT**
3. Paste the prompt into ChatGPT and generate the image there
4. Return to the RP website
5. Press **Upload Result**
6. Select the generated image
7. The image appears inside the RP timeline

## Important

The Scene system makes NO request to:

`/api/scene-image`

and makes NO request to:

`/v1/images/generations`

So your website does not spend OpenAI API image-generation credits.

Your normal Emi conversation still uses:

`api/chat.js`

and therefore still uses your OpenAI API key for text/vision roleplay.

## GitHub structure

```text
RP-Emi/
├── api/
│   └── chat.js
├── app.js
├── index.html
├── style.css
├── package.json
├── vercel.json
└── .env.example
```

`api/scene-image.js` is intentionally removed.

## Vercel environment variables

Only these are needed for the RP chat:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
```

You can delete:
- OPENAI_IMAGE_MODEL
- OPENAI_IMAGE_QUALITY

from Vercel if you no longer use any image API elsewhere.

## After deploying

1. Commit all replacement files to `main`
2. Delete `api/scene-image.js` from GitHub
3. Wait for Vercel deployment
4. Hard refresh with Ctrl+Shift+R
5. Try the Scene button
