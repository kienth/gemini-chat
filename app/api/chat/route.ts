import { NextRequest, NextResponse } from "next/server";

interface MessageHistoryItem {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inline_data?: {
      mime_type: string;
      data: string;
    };
  }>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (retryAfter: string | null): number | null => {
  if (!retryAfter) return null;

  // Most APIs return seconds in Retry-After.
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0)
    return Math.round(seconds * 1000);

  // Also support HTTP-date format.
  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? delta : 0;
  }

  return null;
};

const isRetryableGeminiFailure = (
  status: number,
  errorText: string
): boolean => {
  if ([429, 500, 502, 503, 504].includes(status)) return true;

  // Gemini sometimes returns a JSON error body with a status field.
  try {
    const parsed = JSON.parse(errorText) as any;
    const apiStatus = parsed?.error?.status;
    if (apiStatus === "UNAVAILABLE" || apiStatus === "RESOURCE_EXHAUSTED") {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
};

const fetchGeminiWithRetry = async (
  url: string,
  init: RequestInit,
  opts?: { maxAttempts?: number }
) => {
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? 4);
  const baseDelayMs = 500;
  const maxDelayMs = 8000;

  let lastResponse: Response | null = null;
  let lastErrorText: string | null = null;
  let lastThrown: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init);
      lastResponse = response;

      if (response.ok) return { response };

      const errorText = await response.text();
      lastErrorText = errorText;

      const retryable = isRetryableGeminiFailure(response.status, errorText);
      const isLast = attempt === maxAttempts;
      if (!retryable || isLast) {
        return { response, errorText };
      }

      const retryAfterMs = parseRetryAfterMs(
        response.headers.get("retry-after")
      );
      const exponential = Math.min(
        maxDelayMs,
        baseDelayMs * Math.pow(2, attempt - 1)
      );
      const jitter = Math.floor(Math.random() * 250);
      const delayMs = Math.min(
        maxDelayMs,
        Math.max(0, retryAfterMs ?? exponential) + jitter
      );

      console.warn(
        `Gemini API transient error (status ${response.status}); retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`
      );
      await sleep(delayMs);
      continue;
    } catch (err) {
      lastThrown = err;
      const isLast = attempt === maxAttempts;
      if (isLast) break;

      const exponential = Math.min(
        maxDelayMs,
        baseDelayMs * Math.pow(2, attempt - 1)
      );
      const jitter = Math.floor(Math.random() * 250);
      const delayMs = Math.min(maxDelayMs, exponential + jitter);
      console.warn(
        `Gemini API fetch failed; retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`
      );
      await sleep(delayMs);
    }
  }

  const thrownMessage =
    lastThrown instanceof Error ? lastThrown.message : String(lastThrown);
  return {
    response: lastResponse,
    errorText:
      lastErrorText ??
      `{"error":{"code":500,"message":"Request failed before receiving a response: ${thrownMessage}","status":"INTERNAL"}}`,
  };
};

export async function POST(request: NextRequest) {
  try {
    const { message, image, conversationHistory = [] } = await request.json();

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

    // Prepare the current message parts
    const currentParts: any[] = [];

    if (message) {
      // For very long text, add a prompt to help the AI understand the task
      let processedMessage = message;
      if (message.length > 2000) {
        processedMessage = `Please analyze and summarize the following detailed work log. Provide a comprehensive summary organized by key activities and achievements:\n\n${message}`;
      }
      currentParts.push({ text: processedMessage });
    }

    if (image) {
      // Convert base64 image to the format Gemini expects
      const base64Data = image.split(",")[1]; // Remove data:image/...;base64, prefix
      const mimeType = image.split(",")[0].split(":")[1].split(";")[0]; // Extract mime type

      currentParts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data,
        },
      });
    }

    // Build conversation contents with history
    const contents: any[] = [];

    // Add conversation history (limit to last 10 exchanges to avoid token limits)
    const recentHistory = conversationHistory.slice(-20); // Last 20 messages (10 exchanges)
    contents.push(...recentHistory);

    // Add current user message
    contents.push({
      role: "user",
      parts: currentParts,
    });

    // Call Google Gemini API with enhanced configuration for long text
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
    const init: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048, // Increased for longer responses
          topP: 0.8,
          topK: 40,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    };

    const { response, errorText } = await fetchGeminiWithRetry(url, init, {
      maxAttempts: 4,
    });

    if (!response || !response.ok) {
      const status = response?.status ?? 502;
      return NextResponse.json(
        { error: `Gemini API error: ${errorText ?? "Unknown error"}` },
        { status }
      );
    }

    const data = await response.json();

    // Enhanced response extraction with better error handling
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json(
        {
          error:
            "No response candidates generated. The request might have been blocked by safety filters.",
        },
        { status: 400 }
      );
    }

    const candidate = data.candidates[0];
    console.log(`text: ${candidate.content.parts[0].text}`);
    if (
      !candidate.content ||
      !candidate.content.parts ||
      candidate.content.parts.length === 0
    ) {
      console.error("Invalid candidate structure:", candidate);
      return NextResponse.json(
        { error: "Invalid response structure from Gemini API" },
        { status: 500 }
      );
    }

    const text = candidate.content.parts[0].text;

    if (!text || text.trim() === "") {
      console.error("Empty text response:", candidate);
      return NextResponse.json(
        {
          error:
            "Empty response from Gemini API. Content might have been filtered.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
