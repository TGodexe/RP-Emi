# Emi RP — Scene Images + Photo Upload + Gift System

This patch is designed for your current Vercel/GitHub RP project.

## New features

### 1. Generate Scene
A new **🖼️ Scene** button generates an anime illustration of the current roleplay scene.

The backend uses the OpenAI Image API at:

`POST /v1/images/generations`

Default model:

`gpt-image-2.5-sunburst`

Default quality:

`low`

### 2. Send a Photo
The **📷** button lets Mark attach a real image.

The browser:
- compresses it before upload
- stores it locally with IndexedDB
- sends the latest image to `/api/chat`

The chat backend passes it to the Responses API as an `input_image`, so Emi can respond to what is actually visible.

### 3. Gift System
The **🎁 Gift** button gives Emi one of several gifts.

Each unique gift gives its relationship bonus once per story:
- Lavender Notebook +1
- Psychology Book +1
- Handmade Bookmark +2
- Small Bouquet +2
- Star Charm +1
- Study Snack +1

Repeated gifts can still be roleplayed, but do not endlessly farm relationship points.

## Install

Replace these files in the root of your GitHub repo:

- `index.html`
- `style.css`
- `app.js`

Replace:

- `api/chat.js`

Add:

- `api/scene-image.js`

Commit the changes to `main`. Vercel should redeploy automatically.

## Vercel environment variables

You already need:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Optional image settings:

- `OPENAI_IMAGE_MODEL=gpt-image-2.5-sunburst`
- `OPENAI_IMAGE_QUALITY=low`

If you do not add the optional variables, the backend uses those defaults automatically.

## Important

After deployment, click **New Story** once so the updated local story state is initialized.

Generated images and uploaded photos are stored in the browser using IndexedDB, not in GitHub.

Image generation uses OpenAI API credits.
