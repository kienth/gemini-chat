import Image from "next/image";

export type MessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
  isError?: boolean;
  canResend?: boolean;
  canFallbackToBotLibre?: boolean;
  fallbackQuery?: string;
};

interface MessageProps {
  message: MessageType;
  onResend?: (message: MessageType) => void;
  onFallbackToBotLibre?: (message: MessageType) => void;
}

export default function Message({
  message,
  onResend,
  onFallbackToBotLibre,
}: MessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[90%] sm:max-w-[70%] rounded-lg p-3 sm:p-4 ${
          message.role === "user"
            ? "bg-blue-500 text-white"
            : message.isError
            ? "bg-red-50 text-red-900 shadow-sm border border-red-200 border-l-4 border-l-red-400"
            : "bg-white text-gray-800 shadow-sm border border-gray-200"
        }`}
      >
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            {message.role === "user" ? (
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                U
              </div>
            ) : (
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                  message.isError ? "bg-red-500" : "bg-gray-600"
                }`}
              >
                {message.isError ? "⚠️" : "🤖"}
              </div>
            )}
          </div>
          <div className="flex-1">
            {message.image && (
              <div className="mb-3">
                <Image
                  src={message.image}
                  alt="Uploaded image"
                  width={200}
                  height={200}
                  className="rounded-lg object-cover w-full max-w-[240px] h-auto"
                />
              </div>
            )}
            {message.content && (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {/* Resend button for failed messages */}
            {message.isError &&
              ((message.canResend && onResend) ||
                (message.canFallbackToBotLibre && onFallbackToBotLibre)) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.canResend && onResend && (
                    <button
                      onClick={() => onResend(message)}
                      className="inline-flex items-center px-3 py-1 text-xs bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
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
                        className="mr-1"
                      >
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                      </svg>
                      Resend
                    </button>
                  )}

                  {/* {message.canFallbackToBotLibre && onFallbackToBotLibre && (
                    <button
                      onClick={() => onFallbackToBotLibre(message)}
                      className="inline-flex items-center px-3 py-1 text-xs bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                      title="Open Bot Libre and copy your message"
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
                        className="mr-1"
                      >
                        <path d="M14 3h7v7"></path>
                        <path d="M10 14L21 3"></path>
                        <path d="M21 14v7h-7"></path>
                        <path d="M3 10V3h7"></path>
                        <path d="M3 21l7-7"></path>
                      </svg>
                      Open Bot Libre
                    </button>
                  )} */}
                </div>
              )}

            <div className="flex items-center justify-between mt-2">
              <p
                className={`text-xs ${
                  message.role === "user"
                    ? "text-blue-100"
                    : message.isError
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {formatTime(message.timestamp)}
              </p>

              {/* Resend button for user messages */}
              {message.role === "user" && onResend && (
                <button
                  onClick={() => onResend(message)}
                  className="text-xs text-blue-200 hover:text-white opacity-70 hover:opacity-100 transition-opacity"
                  title="Resend this message"
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
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
