const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const choicesBox = document.getElementById('choices');

const affectionFill = document.getElementById('affectionFill');
const affectionLabel = document.getElementById('affectionLabel');
const affectionValue = document.getElementById('affectionValue');
const chapterLabel = document.getElementById('chapterLabel');
const dayLabel = document.getElementById('dayLabel');
const routeLabel = document.getElementById('routeLabel');
const sceneTitle = document.getElementById('sceneTitle');

const SAVE_KEY = 'emi_mark_rp_v1';

const defaultState = () => ({
  affection: 0,
  chapter: 1,
  day: 1,
  route: 'Friendship',
  scene: 'Monday Morning — Classroom',
  flags: {
    confessed: false,
    danielMentioned: false,
    emiQuestioning: false,
    slowBurnUnlocked: false
  },
  messages: []
});

let state = defaultState();

const cast = {
  Emi: { initial: 'E', className: 'emi' },
  Mark: { initial: 'M', className: 'mark' },
  Daniel: { initial: 'D', className: 'daniel' },
  Mia: { initial: 'Mi', className: 'mia' },
  Ryan: { initial: 'R', className: 'ryan' },
  System: { initial: '', className: 'system' }
};

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function relationshipLabel(value) {
  if (value < 15) return 'Best Friend';
  if (value < 30) return 'Curious';
  if (value < 45) return 'Questioning';
  if (value < 65) return 'Growing Feelings';
  if (value < 85) return 'Romantic Tension';
  return 'Love Route';
}

function routeFor(value) {
  if (value < 30) return 'Friendship';
  if (value < 45) return 'Slow Burn';
  if (value < 65) return 'Uncertain Hearts';
  if (value < 85) return 'Romance';
  return 'Love Route';
}

function addAffection(amount) {
  state.affection = clamp(state.affection + amount, 0, 100);
  state.route = routeFor(state.affection);
  if (state.affection >= 30) state.flags.emiQuestioning = true;
  if (state.affection >= 45) state.flags.slowBurnUnlocked = true;
  updateHUD();
  saveGame(false);
}

function updateHUD() {
  affectionFill.style.width = `${state.affection}%`;
  affectionValue.textContent = `${state.affection} / 100`;
  affectionLabel.textContent = relationshipLabel(state.affection);
  chapterLabel.textContent = state.chapter;
  dayLabel.textContent = state.day;
  routeLabel.textContent = state.route;
  sceneTitle.textContent = state.scene;
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatText(text) {
  return escapeHTML(text)
    .replace(/\*(.*?)\*/g, '<span class="action">*$1*</span>')
    .replace(/\n/g, '<br>');
}

function addMessage(character, text, save = true) {
  state.messages.push({ character, text, time: Date.now() });
  renderMessages();
  if (save) saveGame(false);
}

function renderMessages() {
  chat.innerHTML = '';

  state.messages.forEach(msg => {
    const info = cast[msg.character] || cast.System;
    const wrap = document.createElement('div');
    wrap.className = `message ${info.className}`;

    if (msg.character !== 'System') {
      const avatar = document.createElement('div');
      avatar.className = `avatar ${info.className}`;
      avatar.textContent = info.initial;
      wrap.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (msg.character !== 'System') {
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = msg.character;
      bubble.appendChild(name);
    }

    const body = document.createElement('div');
    body.className = 'text';
    body.innerHTML = formatText(msg.text);
    bubble.appendChild(body);
    wrap.appendChild(bubble);
    chat.appendChild(wrap);
  });

  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function saveGame(showToast = true) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if (showToast) temporarySystem('Game saved.');
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    startStory();
    return;
  }

  try {
    state = JSON.parse(raw);
    updateHUD();
    renderMessages();
  } catch {
    localStorage.removeItem(SAVE_KEY);
    startStory();
  }
}

function temporarySystem(text) {
  const node = document.createElement('div');
  node.className = 'message system';
  node.innerHTML = `<div class="bubble"><div class="text">${escapeHTML(text)}</div></div>`;
  chat.appendChild(node);
  chat.scrollTop = chat.scrollHeight;
  setTimeout(() => node.remove(), 1200);
}

function resetGame() {
  const ok = confirm('Reset the entire story and relationship progress?');
  if (!ok) return;
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  choicesBox.innerHTML = '';
  startStory();
}

function startStory() {
  state = defaultState();
  updateHUD();
  state.messages = [];

  addMessage('System', 'Final year of high school. Mark and Emi have been best friends since childhood.', false);
  addMessage('Emi', '*Morning sunlight fills the classroom. Emi drops into the seat beside Mark and taps his desk with her pen.*\n“Morning, Mark. You look unusually quiet today. Everything okay?”', false);
  addMessage('Daniel', '*Daniel walks into the classroom and gives Emi a casual wave.*\n“Morning, Emi.”', false);
  addMessage('Emi', '*Emi brightens for a moment, waves back at Daniel, then turns to Mark again.*\n“Hehe… anyway, what’s going on in that head of yours?”', false);
  saveGame(false);

  showChoices([
    { text: 'Nothing. Just tired.', affection: 0 },
    { text: 'Can I tell you something serious?', affection: 2 },
    { text: '*Stay quiet and look away*', affection: 1 }
  ]);
}

function showChoices(options) {
  choicesBox.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      choicesBox.innerHTML = '';
      addMessage('Mark', opt.text);
      if (opt.affection) addAffection(opt.affection);
      setTimeout(() => emiReply(opt.text), 350);
    });
    choicesBox.appendChild(btn);
  });
}

function sendPlayerMessage() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  resizeInput();
  choicesBox.innerHTML = '';
  addMessage('Mark', text);
  setTimeout(() => emiReply(text), 350);
}

function emiReply(rawText) {
  const text = rawText.toLowerCase();
  let reply = '';
  let affection = 0;

  if (/i love you|love you|i've loved you|i always love you/.test(text)) {
    state.flags.confessed = true;
    affection = 4;
    reply = state.affection >= 45
      ? '*Emi goes completely still. Her cheeks warm, and for once she has no teasing answer ready.*\n“Mark… I know I shouldn’t answer carelessly anymore. My feelings aren’t as simple as they used to be.”'
      : '*Emi goes quiet, clearly taking the words seriously.*\n“Mark… I care about you deeply. But I don’t want to lie to you. Right now, I still see you as my best friend… and I still have feelings for Daniel.”';
  }
  else if (/daniel/.test(text)) {
    state.flags.danielMentioned = true;
    reply = '*Emi glances toward Daniel’s side of the room, then back at Mark.*\n“Daniel? He’s… yeah, I like him. Why do you ask?”';
  }
  else if (/best friend|bestie/.test(text)) {
    affection = 2;
    reply = '*Emi smiles warmly and bumps her shoulder against Mark’s.*\n“Hehe… yeah. My best friend. You’re kind of stuck with me.”';
  }
  else if (/marry|marriage|wife|husband/.test(text)) {
    affection = 2;
    reply = '*Emi raises an eyebrow, amused but curious.*\n“Wow, planning that far ahead already? You really do think about everything.”';
  }
  else if (/successful|future|graduation|job/.test(text)) {
    affection = 1;
    reply = '*Emi looks out the window thoughtfully.*\n“I wonder about that too. I think I just want a life that feels like mine… and people around me who still feel like home.”';
  }
  else if (/leave|go away|disappear/.test(text)) {
    reply = '*Emi’s playful expression fades.*\n“If you need space, I’ll respect that. But don’t disappear just because you think it would make things easier for me.”';
  }
  else if (/sad|hurt|pain|cry/.test(text)) {
    affection = 1;
    reply = '*Emi softens immediately.*\n“Hey… you don’t have to pretend with me. You can just say it hurts.”';
  }
  else if (/anime|philosophy|comic|manga|book/.test(text)) {
    affection = 1;
    reply = '*Emi grins.*\n“Hehe… there’s the Mark I know. Give you five minutes and somehow we end up talking about anime or philosophy.”';
  }
  else if (/food|lunch|snack|hungry/.test(text)) {
    reply = '*Emi immediately perks up.*\n“Now that is a serious topic. Come on, bestie. Food first, existential crisis later.”';
  }
  else if (/nothing|never mind|nvm/.test(text)) {
    reply = '*Emi studies Mark for a moment, then lets it go.*\n“Okay. I won’t push. But I’m here if you change your mind.”';
  }
  else if (/sorry|apolog/.test(text)) {
    reply = '*Emi tilts her head, concerned.*\n“Why are you apologizing? Talk to me first before you decide you did something wrong.”';
  }
  else if (/bye|see you|later/.test(text)) {
    reply = '*Emi gives Mark a small wave.*\n“See you later. And don’t disappear for three days just to be dramatic, okay?”';
  }
  else {
    const pool = state.affection >= 45
      ? [
          '*Emi looks at Mark a little longer than usual.*\n“You know… lately I keep noticing things about you I never really thought about before.”',
          '*Emi gives a small, thoughtful smile.*\n“Sometimes I think I understand you completely. Then you say something like that and surprise me again.”',
          '*Emi looks away for half a second, oddly flustered.*\n“Seriously, Mark… don’t say things like that so casually.”'
        ]
      : [
          '*Emi tilts her head.*\n“Hmm? What do you mean?”',
          '*Emi smiles softly.*\n“You know you can just tell me, right?”',
          '*Emi lightly taps Mark’s desk with her pen.*\n“Seriously? You’re being mysterious again.”',
          '*Emi laughs quietly.*\n“Hehe… that’s such a Mark thing to say.”'
        ];
    reply = pool[Math.floor(Math.random() * pool.length)];
  }

  if (affection) addAffection(affection);
  addMessage('Emi', reply);

  maybeTriggerSideCharacter(text);
}

function maybeTriggerSideCharacter(text) {
  const roll = Math.random();
  if (roll > 0.22) return;

  setTimeout(() => {
    if (state.flags.confessed && !state.flags.emiQuestioning) {
      addMessage('Mia', '*Mia glances between Emi and Mark from the next row.*\n“You two are acting weird today. Did I miss something?”');
    } else if (state.affection >= 35 && roll < 0.11) {
      addMessage('Daniel', '*Daniel walks over, smiling casually.*\n“Emi, are you free after class? I wanted to ask you something.”');
    } else {
      addMessage('Ryan', '*Ryan leans over the back of Mark’s chair.*\n“Bro, you look like you’re thinking way too hard again.”');
    }
  }, 600);
}

function resizeInput() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
}

sendBtn.addEventListener('click', sendPlayerMessage);
input.addEventListener('input', resizeInput);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendPlayerMessage();
  }
});

saveBtn.addEventListener('click', () => saveGame(true));
resetBtn.addEventListener('click', resetGame);
menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

document.addEventListener('click', e => {
  if (window.innerWidth <= 860 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && e.target !== menuBtn) sidebar.classList.remove('open');
  }
});

loadGame();
updateHUD();
