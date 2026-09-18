const SAVE_KEY = "emi_ai_rp_media_v1";
const DB_NAME = "emi-rp-media";
const DB_VERSION = 1;
const STORE_NAME = "images";

const $ = (id) => document.getElementById(id);

const chat = $("chat");
const input = $("messageInput");
const sendBtn = $("sendBtn");
const typing = $("typing");
const photoBtn = $("photoBtn");
const photoInput = $("photoInput");
const attachmentPreview = $("attachmentPreview");
const attachmentThumb = $("attachmentThumb");
const removeAttachmentBtn = $("removeAttachmentBtn");

const giftBtn = $("giftBtn");
const giftDialog = $("giftDialog");
const giftGrid = $("giftGrid");
const closeGiftBtn = $("closeGiftBtn");

const sceneBtn = $("sceneBtn");
const sceneDialog = $("sceneDialog");
const sceneNote = $("sceneNote");
const scenePromptOutput = $("scenePromptOutput");
const buildPromptBtn = $("buildPromptBtn");
const copyPromptBtn = $("copyPromptBtn");
const openChatGPTBtn = $("openChatGPTBtn");
const uploadSceneResultBtn = $("uploadSceneResultBtn");
const sceneResultInput = $("sceneResultInput");
const closeSceneBtn = $("closeSceneBtn");
const cancelSceneBtn = $("cancelSceneBtn");

const settingsBtn = $("settingsBtn");
const settingsDialog = $("settingsDialog");
const sceneInput = $("sceneInput");
const affectionInput = $("affectionInput");
const saveSettingsBtn = $("saveSettingsBtn");
const closeSettingsBtn = $("closeSettingsBtn");
const cancelSettingsBtn = $("cancelSettingsBtn");

const clearBtn = $("clearBtn");
const newStoryBtn = $("newStoryBtn");

const DEFAULT_SCENE =
  "Final year of high school. Mark and Emi Yukari have been childhood friends for years and became especially close during high school through shared classes, late-night study sessions, school projects, and school events. Mark has secretly loved Emi since middle school. Yesterday, Mark finally confessed his romantic feelings to her. Emi gently rejected him because she currently sees him as her closest friend and has feelings for Daniel, another boy in their class. Emi deeply values Mark and still wears the golden heart-shaped necklace he gave her during their senior year as a symbol of their friendship and shared memories. It is now the morning after the confession. Emi enters the classroom and tries to speak to Mark naturally because she does not want their friendship to become painfully awkward. Emi does not romantically love Mark at the beginning, but her feelings may gradually and naturally change over time depending on their shared experiences.";

const GIFTS = [
  {
    id: "lavender-notebook",
    emoji: "📓",
    name: "Lavender Notebook",
    bonus: 1,
    desc: "A cute notebook for Emi's psychology notes."
  },
  {
    id: "psychology-book",
    emoji: "📚",
    name: "Psychology Book",
    bonus: 1,
    desc: "A thoughtful book related to something she genuinely loves."
  },
  {
    id: "handmade-bookmark",
    emoji: "🔖",
    name: "Handmade Bookmark",
    bonus: 2,
    desc: "A personal handmade gift for all her reading."
  },
  {
    id: "small-bouquet",
    emoji: "💐",
    name: "Small Bouquet",
    bonus: 2,
    desc: "A simple, sincere bouquet with no pressure attached."
  },
  {
    id: "star-charm",
    emoji: "⭐",
    name: "Star Charm",
    bonus: 1,
    desc: "A tiny charm matching the star details on her overalls."
  },
  {
    id: "study-snack",
    emoji: "🍪",
    name: "Study Snack",
    bonus: 1,
    desc: "Something small to share during a long study session."
  }
];

let pendingImage = null;

let state = {
  affection: 12,
  scene: DEFAULT_SCENE,
  receivedGiftIds: [],
  messages: [
    {
      role: "assistant",
      speaker: "Emi",
      text:
        "*Morning sunlight fills the classroom. Emi drops into the seat beside Mark and sets her notebook down.*\n\n" +
        "**“Morning, Mark. You look unusually quiet today. Everything okay?”**"
    }
  ]
};

// ---------- IndexedDB media storage ----------

function openMediaDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putImage(dataUrl) {
  const db = await openMediaDB();
  const id = crypto.randomUUID();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(dataUrl, id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return id;
}

async function getImage(id) {
  if (!id) return null;
  const db = await openMediaDB();

  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });

  db.close();
  return value;
}

async function clearImages() {
  const db = await openMediaDB();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
}

// ---------- Formatting ----------

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function formatRoleplay(text) {
  let safe = escapeHTML(text || "");
  safe = safe.replace(/\*\*(.*?)\*\*/gs, '<span class="dialogue">$1</span>');
  safe = safe.replace(/\*(.*?)\*/gs, '<span class="action">*$1*</span>');
  return safe;
}

function avatarClass(speaker) {
  return `avatar-${String(speaker || "system").toLowerCase()}`;
}

function relationshipLabel(value) {
  if (value < 20) return "Best Friends";
  if (value < 40) return "Emotional Curiosity";
  if (value < 60) return "Questioning Feelings";
  if (value < 80) return "Growing Attraction";
  if (value < 90) return "Realization";
  return "Romantic Feelings";
}

function clampAffection(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// ---------- Rendering ----------

async function render() {
  chat.innerHTML = "";

  for (const message of state.messages) {
    const speaker =
      message.role === "user"
        ? "Mark"
        : message.speaker || "Emi";

    const wrapper = document.createElement("article");
    wrapper.className = `message ${speaker.toLowerCase()}`;

    if (message.kind === "scene") {
      wrapper.className = "message scene";
    }

    const avatar = document.createElement("div");
    avatar.className = `avatar ${avatarClass(message.kind === "scene" ? "scene" : speaker)}`;
    avatar.textContent = message.kind === "scene" ? "🖼" : speaker.slice(0, 1).toUpperCase();

    const card = document.createElement("div");
    card.className = "message-card";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = message.kind === "scene" ? "Scene" : speaker;

    card.appendChild(name);

    if (message.text) {
      const body = document.createElement("div");
      body.innerHTML = formatRoleplay(message.text);
      card.appendChild(body);
    }

    if (message.imageId) {
      const img = document.createElement("img");
      img.className = "message-image";
      img.alt = message.kind === "scene" ? "Generated roleplay scene" : "Photo sent by Mark";
      card.appendChild(img);

      getImage(message.imageId)
        .then((src) => {
          if (src) img.src = src;
        })
        .catch(() => {});
    }

    if (message.gift) {
      const badge = document.createElement("div");
      badge.className = "gift-badge";
      badge.textContent =
        `${message.gift.emoji} ${message.gift.name}` +
        (message.gift.appliedBonus > 0 ? `  +${message.gift.appliedBonus}%` : "  bonus already used");
      card.appendChild(badge);
    }

    if (speaker === "System") {
      wrapper.className = "message system";
      wrapper.append(card);
    } else if (message.kind === "scene") {
      wrapper.append(card);
    } else {
      wrapper.append(avatar, card);
    }

    chat.appendChild(wrapper);
  }

  $("affectionValue").textContent = `${state.affection}%`;
  $("affectionBar").style.width = `${state.affection}%`;
  $("relationshipLabel").textContent = relationshipLabel(state.affection);
  $("storyState").textContent = state.scene;

  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function save() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      affection: state.affection,
      scene: state.scene,
      receivedGiftIds: state.receivedGiftIds,
      messages: state.messages
    })
  );
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        ...parsed,
        receivedGiftIds: Array.isArray(parsed.receivedGiftIds) ? parsed.receivedGiftIds : [],
        messages: Array.isArray(parsed.messages) ? parsed.messages : state.messages
      };
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }

  render();
}

// ---------- Photo handling ----------

async function compressImage(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Please choose an image smaller than 10 MB.");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const maxSide = 1200;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.8);
}

function showPendingImage(dataUrl) {
  pendingImage = dataUrl;
  attachmentThumb.src = dataUrl;
  attachmentPreview.classList.remove("hidden");
}

function clearPendingImage() {
  pendingImage = null;
  photoInput.value = "";
  attachmentThumb.removeAttribute("src");
  attachmentPreview.classList.add("hidden");
}

photoBtn.addEventListener("click", () => photoInput.click());

photoInput.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  if (!file) return;

  try {
    showPendingImage(await compressImage(file));
  } catch (error) {
    alert(error.message);
    clearPendingImage();
  }
});

removeAttachmentBtn.addEventListener("click", clearPendingImage);

// ---------- Chat ----------

function autosize() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

async function buildHistoryForAPI(triggerMessage) {
  const recent = state.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-36)
    .map((m) => ({
      role: m.role,
      speaker: m.role === "user" ? "Mark" : (m.speaker || "Emi"),
      text: m.text || "",
      kind: m.kind || "text",
      gift: m.gift || null
    }));

  // Only attach the image for the most recent user message.
  if (triggerMessage?.imageId) {
    const last = recent[recent.length - 1];
    if (last?.role === "user") {
      last.imageData = await getImage(triggerMessage.imageId);
    }
  }

  return recent;
}

async function requestAI(triggerMessage) {
  sendBtn.disabled = true;
  photoBtn.disabled = true;
  typing.classList.remove("hidden");

  try {
    const messages = await buildHistoryForAPI(triggerMessage);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        scene: state.scene,
        affection: state.affection
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || `Request failed (${response.status})`);
    }

    state.messages.push({
      role: "assistant",
      speaker: data.speaker || "Emi",
      text: data.reply
    });

    if (Number.isFinite(data.affection)) {
      state.affection = clampAffection(data.affection);
    }

    if (typeof data.scene === "string" && data.scene.trim()) {
      state.scene = data.scene.trim();
    }
  } catch (error) {
    state.messages.push({
      role: "assistant",
      speaker: "System",
      text: `Connection error: ${error.message}`
    });
  } finally {
    typing.classList.add("hidden");
    sendBtn.disabled = false;
    photoBtn.disabled = false;
    save();
    await render();
    input.focus();
  }
}

async function sendMessage() {
  let text = input.value.trim();

  if (!text && !pendingImage) return;

  let imageId = null;

  if (pendingImage) {
    imageId = await putImage(pendingImage);
    if (!text) text = "*Mark sends Emi a photo.*";
  }

  const message = {
    role: "user",
    speaker: "Mark",
    text,
    imageId
  };

  state.messages.push(message);

  input.value = "";
  autosize();
  clearPendingImage();
  save();
  await render();
  await requestAI(message);
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("input", autosize);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// ---------- Gifts ----------

function renderGifts() {
  giftGrid.innerHTML = "";

  for (const gift of GIFTS) {
    const used = state.receivedGiftIds.includes(gift.id);
    const button = document.createElement("button");

    button.type = "button";
    button.className = `gift-item ${used ? "gift-used" : ""}`;

    button.innerHTML = `
      <div class="gift-top">
        <span class="gift-name">${gift.emoji} ${gift.name}</span>
        <span class="gift-bonus">${used ? "✓ Given" : `+${gift.bonus}%`}</span>
      </div>
      <div class="gift-desc">${gift.desc}</div>
    `;

    button.addEventListener("click", () => giveGift(gift));
    giftGrid.appendChild(button);
  }
}

giftBtn.addEventListener("click", () => {
  renderGifts();
  giftDialog.showModal();
});

closeGiftBtn.addEventListener("click", () => {
  giftDialog.close();
});

async function giveGift(gift) {
  giftDialog.close();

  const alreadyGiven = state.receivedGiftIds.includes(gift.id);
  const appliedBonus = alreadyGiven ? 0 : gift.bonus;

  if (!alreadyGiven) {
    state.receivedGiftIds.push(gift.id);
    state.affection = clampAffection(state.affection + gift.bonus);
  }

  const message = {
    role: "user",
    speaker: "Mark",
    kind: "gift",
    text: `*Mark gives Emi ${gift.name} as a gift.*`,
    gift: {
      id: gift.id,
      emoji: gift.emoji,
      name: gift.name,
      appliedBonus
    }
  };

  state.messages.push(message);
  save();
  await render();
  await requestAI(message);
}

// ---------- Scene prompt workflow (no Images API) ----------

function relationshipStageForPrompt(value) {
  if (value >= 90) return "Emi is fully aware she romantically loves Mark.";
  if (value >= 80) return "Emi has realized she has romantic feelings for Mark.";
  if (value >= 60) return "Emi is developing genuine romantic attraction toward Mark.";
  if (value >= 40) return "Emi is questioning whether her feelings are more than friendship.";
  if (value >= 20) return "Emi has subtle emotional curiosity beyond ordinary friendship.";
  return "Emi sees Mark as her very close childhood best friend, with no romantic feelings yet.";
}

function buildScenePrompt() {
  const recent = state.messages
    .slice(-10)
    .filter((m) => m.text)
    .map((m) => {
      const speaker = m.role === "user" ? "Mark" : (m.speaker || "Emi");
      return `${speaker}: ${m.text}`;
    })
    .join("
");

  const direction = sceneNote.value.trim();

  return `Create a polished anime-style visual-novel illustration of the CURRENT RP SCENE below.

CHARACTER CONSISTENCY

Emi Yukari:
- short purple hair with soft bangs
- small yellow hair clip on one side
- bright blue expressive eyes
- cute, warm, approachable face
- white and light-lavender striped long-sleeve shirt
- dark blue denim overalls
- decorative star-shaped pins on the straps
- golden heart-shaped pendant necklace given by Mark
- gentle, friendly, emotionally observant personality

Mark:
- tall male, 6'2" / 188 cm
- blonde hair
- blue eyes
- handsome
- muscular and athletic physique
- calm, thoughtful presence
- likes philosophy, anime, comics, knowledge, and cats

RELATIONSHIP
${relationshipStageForPrompt(state.affection)}
Current relationship value: ${state.affection}/100.

CURRENT STORY
${state.scene}

RECENT DIALOGUE / ACTIONS
${recent || "No recent dialogue available."}

OPTIONAL VISUAL DIRECTION
${direction || "Choose the most emotionally appropriate visual moment from the current scene."}

ART DIRECTION
- high-quality anime illustration
- visual-novel key art
- cinematic but soft natural lighting
- detailed environment matching the story location
- expressive but believable body language
- preserve Emi and Mark's established designs
- maintain continuity with the recent dialogue
- no speech bubbles
- no text captions
- no UI elements
- no watermark
- no character-sheet layout
- no sexualization
- if the active timeline is high school, keep the scene wholesome and age-appropriate
- do not make Emi and Mark physically or romantically closer than the current relationship stage justifies

Create ONE finished scene image, not a collage.`;
}

sceneBtn.addEventListener("click", () => {
  sceneNote.value = "";
  scenePromptOutput.value = buildScenePrompt();
  sceneDialog.showModal();
});

closeSceneBtn.addEventListener("click", () => {
  sceneDialog.close();
});

cancelSceneBtn.addEventListener("click", () => {
  sceneDialog.close();
});

buildPromptBtn.addEventListener("click", () => {
  scenePromptOutput.value = buildScenePrompt();
});

copyPromptBtn.addEventListener("click", async () => {
  const prompt = scenePromptOutput.value.trim() || buildScenePrompt();
  scenePromptOutput.value = prompt;

  try {
    await navigator.clipboard.writeText(prompt);
    const old = copyPromptBtn.textContent;
    copyPromptBtn.textContent = "✓ Copied";
    setTimeout(() => {
      copyPromptBtn.textContent = old;
    }, 1300);
  } catch {
    scenePromptOutput.focus();
    scenePromptOutput.select();
    document.execCommand("copy");
  }
});

openChatGPTBtn.addEventListener("click", () => {
  const prompt = scenePromptOutput.value.trim() || buildScenePrompt();
  scenePromptOutput.value = prompt;

  navigator.clipboard?.writeText(prompt).catch(() => {});
  window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
});

uploadSceneResultBtn.addEventListener("click", () => {
  sceneResultInput.click();
});

sceneResultInput.addEventListener("change", async () => {
  const file = sceneResultInput.files?.[0];
  if (!file) return;

  try {
    const dataUrl = await compressImage(file);
    const imageId = await putImage(dataUrl);

    state.messages.push({
      role: "assistant",
      speaker: "Scene",
      kind: "scene",
      text: "*A visual moment from the current story, generated in ChatGPT.*",
      imageId
    });

    sceneResultInput.value = "";
    save();
    await render();
    sceneDialog.close();
  } catch (error) {
    alert(`Couldn't add the scene image: ${error.message}`);
  }
});

// ---------- Settings / reset ----------

settingsBtn.addEventListener("click", () => {
  sceneInput.value = state.scene;
  affectionInput.value = state.affection;
  settingsDialog.showModal();
});

closeSettingsBtn.addEventListener("click", () => {
  settingsDialog.close();
});

cancelSettingsBtn.addEventListener("click", () => {
  settingsDialog.close();
});

saveSettingsBtn.addEventListener("click", (event) => {
  event.preventDefault();
  state.scene = sceneInput.value.trim() || DEFAULT_SCENE;
  state.affection = clampAffection(Number(affectionInput.value) || 0);
  save();
  render();
  settingsDialog.close();
});

async function resetStory() {
  state = {
    affection: 12,
    scene: DEFAULT_SCENE,
    receivedGiftIds: [],
    messages: [
      {
        role: "assistant",
        speaker: "Emi",
        text:
          "*Morning sunlight fills the classroom. Emi drops into the seat beside Mark and sets her notebook down.*\n\n" +
          "**“Morning, Mark. You look unusually quiet today. Everything okay?”**"
      }
    ]
  };

  await clearImages().catch(() => {});
  clearPendingImage();
  save();
  await render();
}

clearBtn.addEventListener("click", async () => {
  if (confirm("Clear this conversation and restart the story?")) {
    await resetStory();
  }
});

newStoryBtn.addEventListener("click", async () => {
  if (confirm("Start a completely new story? Gifts and generated images will reset too.")) {
    await resetStory();
  }
});

load();
