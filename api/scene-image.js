const IMAGE_MODEL =
  process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";

const IMAGE_QUALITY =
  process.env.OPENAI_IMAGE_QUALITY || "low";

function buildScenePrompt({ scene, affection, note, messages }) {
  const recent = Array.isArray(messages)
    ? messages
        .slice(-10)
        .map((m) => `${m.speaker || "Character"}: ${m.text || ""}`)
        .join("\n")
    : "";

  let relationshipStage = "close childhood friends";
  if (affection >= 90) relationshipStage = "mutually romantic, deeply in love";
  else if (affection >= 80) relationshipStage = "Emi has realized romantic love for Mark";
  else if (affection >= 60) relationshipStage = "growing romantic attraction";
  else if (affection >= 40) relationshipStage = "Emi is questioning whether her feelings are more than friendship";
  else if (affection >= 20) relationshipStage = "subtle emotional curiosity beyond ordinary friendship";

  return `
Create one polished anime-style visual-novel scene from this fictional roleplay.

CHARACTER CONSISTENCY

Emi Yukari:
- young adult / age-appropriate for the active timeline
- short purple hair with soft bangs
- small yellow hair clip on one side
- large expressive blue eyes
- cute, warm, approachable face
- white-and-light-lavender striped long-sleeve shirt
- dark blue denim overalls
- small star-shaped pins on the overall straps
- golden heart-shaped pendant necklace from Mark

Mark:
- young adult / age-appropriate for the active timeline
- tall, 6'2"
- blonde hair
- blue eyes
- handsome
- muscular and athletic physique
- calm, thoughtful presence

RELATIONSHIP STAGE
${relationshipStage} (${affection}/100).

CURRENT STORY
${scene || "A quiet school-day moment between Emi and Mark."}

RECENT DIALOGUE
${recent}

USER'S OPTIONAL VISUAL DIRECTION
${note || "No extra direction. Choose the most emotionally appropriate moment from the current scene."}

ART DIRECTION
- high-quality anime illustration
- visual-novel key art
- natural body language and believable emotion
- cinematic but soft lighting
- detailed environment matching the current setting
- consistent character designs
- no text, speech bubbles, captions, UI, watermark, or character sheet
- no sexualization
- if the timeline is high school, keep everything wholesome and age-appropriate
- do not depict intimacy beyond what the relationship stage and current story justify
`;
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
    scene = "",
    affection = 12,
    note = "",
    messages = []
  } = req.body || {};

  const safeAffection = Math.max(
    0,
    Math.min(100, Number(affection) || 0)
  );

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: buildScenePrompt({
            scene,
            affection: safeAffection,
            note,
            messages
          }),
          size: "1024x1024",
          quality: IMAGE_QUALITY
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.error ||
        `OpenAI image request failed (${response.status})`;

      return res.status(response.status).json({ error: message });
    }

    const base64 = data?.data?.[0]?.b64_json;

    if (!base64) {
      return res.status(500).json({
        error: "The image API returned no image data."
      });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${base64}`,
      caption: "*A visual moment from the current story.*"
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Unknown image generation error"
    });
  }
}
