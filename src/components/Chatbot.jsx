import { useState } from "react";
import { useChatStream } from "../hooks/useChatStream";

export default function Chatbot() {
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, stopGeneration } = useChatStream();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 bg-gray-50">
      {/* Header */}
      <header className="mb-4 pb-2 border-b">
        <h1 className="text-2xl font-bold text-gray-800">DevMindAI Assistant</h1>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-white rounded-lg border shadow-sm">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            Ask a question about your codebase to get started.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.content || (isLoading && index === messages.length - 1 ? "Thinking..." : "")}
            </div>
          ))
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the codebase..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />

        {isLoading ? (
          <button
            type="button"
            onClick={stopGeneration}
            className="px-5 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}