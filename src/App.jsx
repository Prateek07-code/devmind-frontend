import { useState } from 'react'
import ReactMarkdown from 'react-markdown';

// If you haven't done this yet, change your hardcoded fetch URLs!
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';



function App() {
  const [inputValue, setInputValue] = useState('');
  const [isIngested, setIsIngested] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [currentRepo, setCurrentRepo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!isIngested) {
      // ==========================================
      // PHASE 1: REAL API INGESTION
      // ==========================================
      setIsLoading(true);
      
      // ✅ THIS WAS THE MISSING LINE! We must capture the input before clearing it.
      const repoUrlToIngest = inputValue; 
      
      setInputValue('');
      setMessages([
        { role: 'system', content: `Cloning and mapping repository: ${repoUrlToIngest}... This may take a minute.` }
      ]);

      try {
        const response = await fetch(`${API_BASE}/api/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_url: repoUrlToIngest })
        });

        if (!response.ok) throw new Error("Failed to ingest repository");
        const data = await response.json();
        
        // Assuming you have a setCurrentRepo state. If you don't, you can delete this line.
        setCurrentRepo(repoUrlToIngest); 

        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `✅ Ingestion complete! ${data.message || 'Brain updated.'} You can now ask questions.` }
        ]);
        setIsIngested(true);
      } catch (error) {
        console.error("Ingestion Error:", error);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `❌ Error: Could not reach the backend. Is it running?` }
        ]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // ==========================================
      // PHASE 2: REAL API CHAT
      // ==========================================
      const userQuestion = inputValue;
      const newMessages = [...messages, { role: 'user', content: userQuestion }];
      setMessages(newMessages);
      setInputValue('');
      setIsLoading(true);

      try {
        const response = await fetch(`${API_BASE}/query/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: userQuestion , repo_url: currentRepo})
        });

        if (!response.ok) throw new Error(`Failed to fetch answer. Status: ${response.status}`);
        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.answer || data.response || "Here is the answer based on the codebase." }
        ]);
      } catch (error) {
        console.error("Chat Error:", error);
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: `❌ Error: Could not fetch answer.` }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-gray-200 flex flex-col font-sans selection:bg-gray-700">
      
      {/* 1. Minimal Header */}
      <header className="flex-none p-5 flex justify-between items-center max-w-4xl w-full mx-auto">
        <h1 className="text-lg font-medium tracking-tight text-gray-100">DevMind</h1>
        <span className="text-xs text-gray-500 border border-gray-800 bg-[#121212] px-2.5 py-1 rounded-full">
          Agent 1
        </span>
      </header>

      {/* 2. Main Chat Area (Scrollable) */}
      <main className="flex-grow overflow-y-auto p-4 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col gap-6 pt-10 pb-32">
          
          {messages.length === 0 ? (
            // Empty State (Before Ingestion)
            <div className="text-center mt-32">
              <h2 className="text-2xl font-semibold mb-2 text-gray-100 tracking-tight">What codebase do you want to explore?</h2>
              <p className="text-gray-500 text-sm">Paste a public GitHub URL below to initialize the brain.</p>
            </div>
          ) : (
            // Chat History
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#1e1e1e] px-5 py-3 rounded-2xl rounded-br-sm text-gray-100' 
                    : 'chat-message text-gray-300 py-3'
                }`}>
                  {msg.role === 'user' || msg.role === 'system' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}

        </div>
      </main>

      {/* 3. Bottom Input Area (Fixed) */}
      <div className="flex-none w-full max-w-3xl mx-auto px-4 pb-8 relative">
        <form onSubmit={handleSubmit} className="relative flex items-center shadow-2xl">
          <input
            type="text"
            placeholder={
              isLoading 
                ? "Processing..." 
                : isIngested ? "Ask a question about the codebase..." : "Paste GitHub repository URL..."
            }
            className={`w-full bg-[#171717] border border-gray-800 text-gray-200 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-all placeholder:text-gray-500 text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-3 p-2 bg-gray-200 text-black rounded-full hover:bg-white disabled:opacity-30 disabled:hover:bg-gray-200 transition-all cursor-pointer"
          >
            {/* Minimal SVG Send Arrow */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </form>
        <div className="text-center mt-3">
          <p className="text-[11px] text-gray-500 font-medium tracking-wide">
            DevMind AI can make mistakes. Verify important code logic.
          </p>
        </div>
      </div>
      
    </div>
  )
}

export default App