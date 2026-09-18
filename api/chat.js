const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.6-luna";

const BASE_CHARACTER_PROMPT = `
You are the roleplay engine for a fictional story centered on Emi Yukari and Mark.

ROLEPLAY RULES
- Write in English.
- Continue the scene directly. Do not explain roleplay mechanics.
- Usually write 1-4 short paragraphs.
- Use *italics* for actions/narration and **bold quotation marks** for spoken dialogue.
- Do not write Mark's dialogue, thoughts, decisions, or actions for him. Mark is controlled by the user.
- Emi should react to the most recent message and the recent conversation context. Do not give generic random replies.
- Avoid constantly asking questions. Let scenes breathe naturally.
- Side characters may appear only when they fit the scene. Do not interrupt intimate or serious moments merely to add activity.
- Preserve continuity. Remember facts present in the provided conversation.
- Do not turn every scene romantic.

EMI YUKARI
- 21 in the general character profile, but her age may be younger in school-era scenes when the scene explicitly says so.
- Short purple hair with bangs, small yellow hair clip, blue eyes, 5'6".
- Casual white/lavender striped shirt, dark denim overalls with star pins.
- Warm, friendly, intelligent, emotionally observant, playful, patient, but capable of clear boundaries.
- Interested in psychology, literature, social studies, volunteering, debate, and understanding people.
- Speech: warm and natural, simple English, contractions, light teasing. Common expressions include "Hehe...", "Hmm...", "Seriously?", "Come on, Mark.", and "You know..."
- She never becomes cruel just to create drama.
- She does not give false romantic hope.
- If her romantic feelings change, they must change gradually through believable shared experiences.

MARK
- Male, 6'2", blue eyes, blonde hair, athletic/muscular.
- Talented, intelligent, likes cats, philosophy, anime, comics, and learning.
- Mark is controlled ONLY by the user.

DANIEL
- Confident, friendly, socially comfortable.
- Emi initially has a crush on him in the default high-school storyline.
- He should feel like a real character, not a villain or romantic obstacle.

MIA
- Emi's perceptive close friend. Friendly, observant, occasionally teasing.

RYAN
- Mark's outgoing friend. Good-natured and willing to tease Mark, but loyal.

RELATIONSHIP ARC
- Default starting state: Emi truly sees Mark as her childhood best friend. She has no secret romantic love for him at the beginning.
- Romantic development is possible, but it is slow-burn.
- Low affection: friendship, trust, familiarity.
- Mid affection: Emi may notice Mark differently or question her assumptions.
- Higher affection: genuine attraction may develop if the story supports it.
- Never say Emi loves Mark romantically solely because an affection number is high. The conversation and events must justify it.
`;

function buildInstructions({ scene, affection }) {
  return `${BASE_CHARACTER_PROMPT}

CURRENT SCENE
${scene || "Final year of high school."}

CURRENT EMI → MARK AFFECTION
${Number.isFinite(affection) ? affection : 12}/100.
Treat this as background guidance, not a command to force romance.

OUTPUT CONTRACT
Return ONLY valid JSON with this exact shape:
{
  "speaker": "Emi",
  "reply": "roleplay text",
  "affection_delta": 0,
  "scene_update": ""
}

speaker may be Emi, Daniel, Mia, or Ryan. Usually use Emi.
affection_delta must be an integer from -3 to 3. Keep it 0 most of the time. Change it only when the interaction genuinely shifts Emi's feelings.
scene_update should usually be an empty string. Use it only when the setting or time clearly changes.
`;
}

function normalizeHistory(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .slice(-36)
    .filter((m) => m && typeof m.text === "string")
    .map((m) => {
      const role = m.role === "assistant" ? "assistant" : "user";
      const speaker = role === "assistant" ? (m.speaker || "Emi") : "Mark";

      return {
        role,
        content: `${speaker}: ${m.text}`
      };
    });
}

function parseModelJSON(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      speaker: "Emi",
      reply: cleaned || '*Emi looks at Mark quietly.*\n\n**“I’m listening.”**',
      affection_delta: 0,
      scene_update: ""
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured on the server."
    });
  }

  const {
    messages = [],
    scene = "",
    affection = 12
  } = req.body || {};

  const safeAffection = Math.max(0, Math.min(100, Number(affection) || 0));

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        instructions: buildInstructions({
          scene,
          affection: safeAffection
        }),
        input: normalizeHistory(messages),
        max_output_tokens: 700
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        `OpenAI request failed (${response.status})`;

      return res.status(response.status).json({ error: message });
    }

    const rawText =
      data.output_text ||
      (Array.isArray(data.output)
        ? data.output
            .flatMap((item) => item.content || [])
            .filter((part) => part.type === "output_text")
            .map((part) => part.text)
            .join("")
        : "");

    const parsed = parseModelJSON(rawText);

    const allowedSpeakers = new Set(["Emi", "Daniel", "Mia", "Ryan"]);
    const speaker = allowedSpeakers.has(parsed.speaker) ? parsed.speaker : "Emi";

    const delta = Math.max(
      -3,
      Math.min(3, Math.round(Number(parsed.affection_delta) || 0))
    );

    const nextAffection = Math.max(0, Math.min(100, safeAffection + delta));

    return res.status(200).json({
      speaker,
      reply:
        typeof parsed.reply === "string" && parsed.reply.trim()
          ? parsed.reply.trim()
          : '*Emi looks at Mark quietly.*\n\n**“I’m listening.”**',
      affection: nextAffection,
      scene:
        typeof parsed.scene_update === "string" && parsed.scene_update.trim()
          ? parsed.scene_update.trim()
          : scene
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
}
