import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, image } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    const model = process.env.GOOGLE_MODEL || "gemini-1.5-flash";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    if (!message && !image) {
      return NextResponse.json(
        { error: "Message or image is required" },
        { status: 400 }
      );
    }

    // Prepare the content parts
    const parts: any[] = [];

    if (message) {
      parts.push({ text: message });
    }

    if (image) {
      // Convert base64 image to the format Gemini expects
      const base64Data = image.split(",")[1]; // Remove data:image/...;base64, prefix
      const mimeType = image.split(",")[0].split(":")[1].split(";")[0]; // Extract mime type

      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
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
              parts: parts,
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
