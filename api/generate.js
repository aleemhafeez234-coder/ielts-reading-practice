export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  const prompt = `You are an experienced IELTS teacher. Create a reading practice test for the topic: "${topic}".

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, no backticks):

{
  "title": "Passage title",
  "paragraphs": [
    "Full paragraph A text. Several sentences long, academic style.",
    "Full paragraph B text. Several sentences long, academic style.",
    "Full paragraph C text. Several sentences long, academic style.",
    "Full paragraph D text. Several sentences long, academic style.",
    "Full paragraph E text. Several sentences long, academic style."
  ],
  "questions": [
    {"id":"q1","skill":"skimming","type":"mcq","question":"What is the main idea of the passage?","options":["A","B","C","D"],"answer":"B","explanation":"..."},
    {"id":"q2","skill":"skimming","type":"mcq","question":"What is the author overall purpose?","options":["A","B","C","D"],"answer":"A","explanation":"..."},
    {"id":"q3","skill":"skimming","type":"tfng","question":"General theme statement","options":["True","False","Not Given"],"answer":"True","explanation":"..."},
    {"id":"q4","skill":"scanning","type":"short_answer","question":"According to the passage, what specific fact or number is mentioned?","answer":"short answer","explanation":"Found in paragraph B: ..."},
    {"id":"q5","skill":"scanning","type":"short_answer","question":"In which paragraph is a specific detail discussed?","answer":"Paragraph C","explanation":"..."},
    {"id":"q6","skill":"scanning","type":"mcq","question":"Which specific detail is mentioned in the passage?","options":["A","B","C","D"],"answer":"C","explanation":"..."},
    {"id":"q7","skill":"detailed","type":"mcq","question":"Based on paragraph X, what can be inferred?","options":["A","B","C","D"],"answer":"D","explanation":"..."},
    {"id":"q8","skill":"detailed","type":"tfng","question":"Precise statement requiring careful reading","options":["True","False","Not Given"],"answer":"False","explanation":"..."},
    {"id":"q9","skill":"detailed","type":"mcq","question":"The word in paragraph X most closely means...","options":["A","B","C","D"],"answer":"B","explanation":"..."},
    {"id":"q10","skill":"detailed","type":"short_answer","question":"According to paragraph X, why does a detail happen?","answer":"concise answer","explanation":"..."}
  ]
}

Rules: Write 400-500 words total across 5 paragraphs. Make all questions answerable from the passage. Return ONLY the JSON.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", JSON.stringify(data));
      return res.status(500).json({ error: "AI generation failed: " + JSON.stringify(data) });
    }

    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(raw);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Server error: " + err.message });
  }
}
