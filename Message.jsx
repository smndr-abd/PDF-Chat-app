export default function Message({ role, content }) {
    const isUser = role === "user";
  
    // Very simple markdown: bold **text** and newlines
    function renderContent(text) {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part.split("\n").map((line, j) => (
          <span key={`${i}-${j}`}>{line}{j < part.split("\n").length - 1 && <br />}</span>
        ));
      });
    }
  
    return (
      <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
        <div className="message-avatar">{isUser ? "YOU" : "AI"}</div>
        <div className="message-bubble">
          {content === "" ? (
            <span className="cursor-blink">▋</span>
          ) : (
            renderContent(content)
          )}
        </div>
      </div>
    );
  }