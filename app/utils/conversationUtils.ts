import { MessageType } from "../components/Message";

export interface ConversationHistoryItem {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inline_data?: {
      mime_type: string;
      data: string;
    };
  }>;
}

export const convertMessagesToHistory = (
  messages: MessageType[]
): ConversationHistoryItem[] => {
  return messages
    .filter((msg) => !msg.isError) // Exclude error messages from history
    .map((msg) => {
      const parts: any[] = [];

      // Add text content if present
      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content });
      }

      // Add image content if present
      if (msg.image) {
        const base64Data = msg.image.split(",")[1];
        const mimeType = msg.image.split(",")[0].split(":")[1].split(";")[0];
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data,
          },
        });
      }

      return {
        role: (msg.role === "user" ? "user" : "model") as "user" | "model",
        parts: parts,
      };
    })
    .filter((item) => item.parts.length > 0); // Only include messages with content
};

export const summarizeConversationContext = (
  messages: MessageType[]
): string => {
  const recentMessages = messages.slice(-6); // Last 6 messages for context

  return recentMessages
    .map(
      (msg) =>
        `${
          msg.role === "user" ? "User" : "Assistant"
        }: ${msg.content?.substring(0, 200)}${
          msg.content && msg.content.length > 200 ? "..." : ""
        }`
    )
    .join("\n");
};

export const shouldIncludeFullHistory = (
  messageCount: number,
  totalTokenEstimate: number
): boolean => {
  // Include full history if:
  // - We have fewer than 10 messages
  // - Or estimated tokens are less than 4000
  return messageCount < 10 || totalTokenEstimate < 4000;
};

export const estimateTokenCount = (text: string): number => {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
};
