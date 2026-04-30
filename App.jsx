import { useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat";
import Uploader from "./components/Uploader";
import Message from "./components/Message";
import ChatInput from "./components/ChatInput";

export default function App() {
  const { session, messages, uploading, thinking, error, upload, ask, reset } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo">
            <LogoIcon />
            <span>PDFChat</span>
          </div>

          {session ? (
            <div className="session-info">
              <div className="session-file">
                <FileIcon />
                <span className="session-filename">{session.filename}</span>
              </div>
              <div className="session-meta">{session.chunks} chunks indexed</div>
              <button className="btn-reset" onClick={reset}>
                ✕ Remove PDF
              </button>
            </div>
          ) : (
            <Uploader onUpload={upload} uploading={uploading} />
          )}

          {error && (
            <div className="error-banner" role="alert">
              ⚠ {error}
            </div>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="how-it-works">
            <p className="how-title">How it works</p>
            <ol className="how-list">
              <li>Upload any PDF</li>
              <li>It gets chunked &amp; embedded locally</li>
              <li>Ask questions in natural language</li>
              <li>Answers are streamed from your local LLM</li>
            </ol>
          </div>
          <div className="powered-by">
            Powered by <strong>Ollama</strong> · <strong>ChromaDB</strong> · <strong>LangChain</strong>
          </div>
        </div>
      </aside>

      {/* Chat area */}
      <main className="chat-area">
        {!session && !uploading ? (
          <div className="empty-state">
            <div className="empty-icon"><BigPDFIcon /></div>
            <h1 className="empty-title">Chat with any PDF</h1>
            <p className="empty-sub">
              Upload a PDF in the sidebar to get started.<br />
              Everything runs locally — your documents never leave your machine.
            </p>
          </div>
        ) : (
          <>
            <div className="messages">
              {messages.map((msg, i) => (
                <Message key={i} role={msg.role} content={msg.content} />
              ))}
              {thinking && messages[messages.length - 1]?.content === "" && null}
              <div ref={bottomRef} />
            </div>

            <div className="input-bar">
              <ChatInput onSend={ask} disabled={thinking || !session} />
              {thinking && (
                <div className="thinking-indicator">
                  <span />
                  <span />
                  <span />
                  AI is thinking…
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function BigPDFIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}