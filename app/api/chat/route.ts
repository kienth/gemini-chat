import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    const model = process.env.GOOGLE_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Gemini API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(data?.candidates?.[0]?.content?.parts?.[0]?.text);
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
