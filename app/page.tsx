"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Message, { MessageType } from "./components/Message";
import { compressImage, validateImageFile } from "./utils/imageUtils";
import { preprocessLongText, getTextStatistics } from "./utils/textUtils";
import { convertMessagesToHistory } from "./utils/conversationUtils";

export default function Home() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<MessageType | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate the file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Compress the image
      const compressedImage = await compressImage(file);
      setSelectedImage(compressedImage);
    } catch (error) {
      setError("Failed to process the image. Please try again.");
      console.error("Image processing error:", error);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleResend = async (messageToResend: MessageType) => {
    // If it's a user message, resend it
    if (messageToResend.role === "user") {
      await sendMessageWithData(messageToResend.content, messageToResend.image);
    } else if (messageToResend.isError && lastUserMessage) {
      // If it's an error message, resend the last user message
      await sendMessageWithData(lastUserMessage.content, lastUserMessage.image);
    }
  };

  const sendMessageWithData = async (
    messageText: string,
    imageData?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Preprocess long text for better AI understanding
      const processedText = preprocessLongText(messageText);

      // Convert current messages to conversation history format
      const conversationHistory = convertMessagesToHistory(messages);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: processedText,
          image: imageData,
          conversationHistory: conversationHistory,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      const errorMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${
          error instanceof Error ? error.message : "Something went wrong"
        }`,
        timestamp: new Date(),
        isError: true,
        canResend: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setLastUserMessage(null);
    setError(null);
  };

  async function sendMessage() {
    if (!input.trim() && !selectedImage) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      image: selectedImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLastUserMessage(userMessage);

    const messageText = input;
    const currentImage = selectedImage;

    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await sendMessageWithData(messageText, currentImage || undefined);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-800 text-center">
              Gemini AI Chat
            </h1>
            <p className="text-center text-gray-600 text-sm mt-1">
              Chat with AI using text and images • Conversation context
              maintained
            </p>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {messages.length} messages
              </div>
              <button
                onClick={clearConversation}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded transition-colors"
                title="Clear conversation history"
              >
                Clear Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-xl font-medium mb-2">Welcome to Gemini AI</h2>
            <p className="mb-4">
              Send a message or upload an image to get started
            </p>
            <div className="mt-6 flex justify-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <span>💬</span>
                <span>Contextual conversations</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🖼️</span>
                <span>Image analysis</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🧠</span>
                <span>Remembers chat history</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 max-w-md mx-auto">
              Your conversation history is preserved for context. The AI will
              remember previous messages and can reference them in responses.
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              onResend={handleResend}
            />
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-sm border border-gray-200 rounded-lg p-4 max-w-[70%]">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs">
                  🤖
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <Image
              src={selectedImage}
              alt="Selected image"
              width={100}
              height={100}
              className="rounded-lg object-cover border-2 border-blue-200"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="flex items-end space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                disabled={loading}
                title="Upload image"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message... (Shift+Enter for new line)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px] max-h-32"
                disabled={loading}
                rows={1}
              />
            </div>

            {/* Text Statistics */}
            {input && (
              <div className="mt-2 text-xs text-gray-500">
                {(() => {
                  const stats = getTextStatistics(input);
                  return (
                    <div className="flex items-center space-x-4">
                      <span>{stats.characters} characters</span>
                      <span>{stats.words} words</span>
                      {stats.isLong && (
                        <span className="text-blue-600 font-medium">
                          ✨ Long text detected - AI will auto-format for better
                          analysis
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !selectedImage)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9 22,2" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center space-x-4">
            <span>Supports JPEG, PNG, GIF, WebP images up to 10MB</span>
            {messages.length > 0 && (
              <div className="flex items-center space-x-1 text-green-600">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="m2 17 10 5 10-5"></path>
                  <path d="m2 12 10 5 10-5"></path>
                </svg>
                <span>
                  Context preserved ({convertMessagesToHistory(messages).length}{" "}
                  exchanges)
                </span>
              </div>
            )}
          </div>
          {lastUserMessage && (
            <button
              onClick={() => handleResend(lastUserMessage)}
              disabled={loading}
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Resend last message"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              <span>Resend last</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
