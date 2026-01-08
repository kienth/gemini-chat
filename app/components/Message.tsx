import Image from "next/image";

export type MessageType = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
  isError?: boolean;
  canResend?: boolean;
};

interface MessageProps {
  message: MessageType;
  onResend?: (message: MessageType) => void;
}

export default function Message({ message, onResend }: MessageProps) {
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
        className={`max-w-[70%] rounded-lg p-4 ${
          message.role === "user"
            ? "bg-blue-500 text-white"
            : message.isError
            ? "bg-red-50 text-red-800 shadow-sm border border-red-200"
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
                  className="rounded-lg object-cover max-w-full h-auto"
                />
              </div>
            )}
            {message.content && (
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {/* Resend button for failed messages */}
            {message.isError && message.canResend && onResend && (
              <div className="mt-3">
                <button
                  onClick={() => onResend(message)}
                  className="inline-flex items-center px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
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
