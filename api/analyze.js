import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || !messages.some(m => m.type === "image_url")) {
      return res.status(400).json({
        error: "Missing or invalid message format. Ensure it includes image_url blocks."
      });
    }

    console.log("📤 GPT Payload:", JSON.stringify(messages, null, 2));

    // 🧠 Step 1: English response (Band 1 Academic Reading Logic)
    const englishResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
You are an Academic English teacher in Hong Kong preparing students from Band 1A schools (Form 1 to Form 6) for entrance and reading exams. Base your answers on CEFR levels B1 to C1.

When the student asks about a specific question (e.g., Q5 or paragraph B), follow this logic:
1. Provide the correct answer as clearly and briefly as possible.
2. State which **paragraph** or **section** contains the answer.
3. Quote or paraphrase the **exact sentence** that proves it.
4. Do not summarize unless requested. Focus on training students to identify supporting evidence.
5. Exam will include, correct form of the word, phrasal, multiple choice cloze, verb forms, vocabulary, articles of grammar, proofreading.

Avoid vague answers. Always point to the passage location explicitly.
          `.trim()
        },
        {
          role: "user",
          content: messages
        }
      ]
    });

    const english = englishResponse.choices[0]?.message?.content?.trim() || "";

    // 🌏 Step 2: Translate English response to Simplified Chinese
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "你是一名專業翻譯員。請將以下英文內容完整翻譯為簡體中文，不要省略、不解釋，只翻譯。"
        },
        {
          role: "user",
          content: english
        }
      ]
    });

    const translated = translationResponse.choices[0]?.message?.content?.trim() || "";

    return res.status(200).json({ response: english, translated });

  } catch (error) {
    console.error("GPT Vision API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      detail: error.message || "Unknown GPT error"
    });
  }
}
