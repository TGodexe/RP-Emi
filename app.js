const SAVE_KEY = "emi_ai_rp_v1";

const $ = (id) => document.getElementById(id);

const chat = $("chat");
const input = $("messageInput");
const sendBtn = $("sendBtn");
const typing = $("typing");
const clearBtn = $("clearBtn");
const newStoryBtn = $("newStoryBtn");
const settingsBtn = $("settingsBtn");
const settingsDialog = $("settingsDialog");
const sceneInput = $("sceneInput");
const affectionInput = $("affectionInput");
const endpointInput = $("endpointInput");
const saveSettingsBtn = $("saveSettingsBtn");

const DEFAULT_SCENE =
  "Final year of high school. Mark and Emi have been best friends since childhood. " +
  "Emi currently has a crush on Daniel. She genuinely sees Mark as her closest friend at the start.";

let state = {
  affection: 12,
  scene: DEFAULT_SCENE,
  endpoint: "/api/chat",
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

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function formatRoleplay(text) {
  let safe = escapeHTML(text);

  safe = safe.replace(/\*\*(.*?)\*\*/gs, '<span class="dialogue">$1</span>');
  safe = safe.replace(/\*(.*?)\*/gs, '<span class="action">*$1*</span>');
  return safe;
}

function avatarClass(speaker) {
  return `avatar-${String(speaker || "system").toLowerCase()}`;
}

function avatarLetter(speaker) {
  if (!speaker) return "•";
  return speaker.slice(0, 1).toUpperCase();
}

function render() {
  chat.innerHTML = "";

  for (const message of state.messages) {
    const speaker =
      message.role === "user" ? "Mark" :
      message.speaker || "Emi";

    const wrapper = document.createElement("article");
    wrapper.className = `message ${speaker.toLowerCase()}`;

    const avatar = document.createElement("div");
    avatar.className = `avatar ${avatarClass(speaker)}`;
    avatar.textContent = avatarLetter(speaker);

    const card = document.createElement("div");
    card.className = "message-card";

    const name = document.createElement("div");
    name.className = "message-name";
    name.textContent = speaker;

    const body = document.createElement("div");
    body.innerHTML = formatRoleplay(message.text);

    card.append(name, body);

    if (speaker === "System") {
      wrapper.className = "message system";
      wrapper.append(card);
    } else {
      wrapper.append(avatar, card);
    }

    chat.append(wrapper);
  }

  $("affectionValue").textContent = `${state.affection}%`;
  $("affectionBar").style.width = `${state.affection}%`;
  $("relationshipLabel").textContent = relationshipLabel(state.affection);
  $("storyState").textContent = state.scene;

  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function relationshipLabel(value) {
  if (value < 20) return "Best Friends";
  if (value < 40) return "Emotional Curiosity";
  if (value < 60) return "Questioning Feelings";
  if (value < 80) return "Growing Attraction";
  return "Romantic Feelings";
}

function save() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return render();

  try {
    const parsed = JSON.parse(raw);
    state = {
      ...state,
      ...parsed,
      messages: Array.isArray(parsed.messages) ? parsed.messages : state.messages
    };
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }

  render();
}

function autosize() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;

  state.messages.push({ role: "user", speaker: "Mark", text });
  input.value = "";
  autosize();
  render();
  save();

  sendBtn.disabled = true;
  typing.classList.remove("hidden");

  try {
    const history = state.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-36)
      .map((m) => ({
        role: m.role,
        speaker: m.role === "user" ? "Mark" : (m.speaker || "Emi"),
        text: m.text
      }));

    const res = await fetch(state.endpoint || "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history,
        scene: state.scene,
        affection: state.affection
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }

    state.messages.push({
      role: "assistant",
      speaker: data.speaker || "Emi",
      text: data.reply
    });

    if (Number.isFinite(data.affection)) {
      state.affection = Math.max(0, Math.min(100, Math.round(data.affection)));
    }

    if (typeof data.scene === "string" && data.scene.trim()) {
      state.scene = data.scene.trim();
    }

  } catch (error) {
    state.messages.push({
      role: "assistant",
      speaker: "System",
      text:
        `Connection error: ${error.message}\n\n` +
        `Make sure OPENAI_API_KEY is configured on your server and the API endpoint is correct.`
    });
  } finally {
    typing.classList.add("hidden");
    sendBtn.disabled = false;
    render();
    save();
    input.focus();
  }
}

function resetStory(full = false) {
  state.affection = 12;
  state.scene = DEFAULT_SCENE;
  state.messages = [
    {
      role: "assistant",
      speaker: "Emi",
      text:
        "*Morning sunlight fills the classroom. Emi drops into the seat beside Mark and sets her notebook down.*\n\n" +
        "**“Morning, Mark. You look unusually quiet today. Everything okay?”**"
    }
  ];

  if (full) {
    state.endpoint = "/api/chat";
  }

  save();
  render();
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("input", autosize);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("Clear the conversation and restart the current story?")) {
    resetStory(false);
  }
});

newStoryBtn.addEventListener("click", () => {
  if (confirm("Start a completely new story?")) {
    resetStory(true);
  }
});

settingsBtn.addEventListener("click", () => {
  sceneInput.value = state.scene;
  affectionInput.value = state.affection;
  endpointInput.value = state.endpoint;
  settingsDialog.showModal();
});

saveSettingsBtn.addEventListener("click", (event) => {
  event.preventDefault();

  state.scene = sceneInput.value.trim() || DEFAULT_SCENE;
  state.affection = Math.max(0, Math.min(100, Number(affectionInput.value) || 0));
  state.endpoint = endpointInput.value.trim() || "/api/chat";

  save();
  render();
  settingsDialog.close();
});

load();
