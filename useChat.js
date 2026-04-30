import { useState, useCallback } from "react";
import { uploadPDF, streamChat, deleteSession } from "../api";

export function useChat() {
  const [session, setSession] = useState(null);   // { id, filename, chunks }
  const [messages, setMessages] = useState([]);   // { role, content }[]
  const [uploading, setUploading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    setMessages([]);
    try {
      const data = await uploadPDF(file);
      setSession({ id: data.session_id, filename: data.filename, chunks: data.chunks });
      setMessages([{
        role: "assistant",
        content: `I've read **${data.filename}** (${data.chunks} chunks indexed). Ask me anything about it!`,
      }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const ask = useCallback(async (question) => {
    if (!session || thinking) return;
    setThinking(true);
    setError(null);

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      for await (const token of streamChat(session.id, question)) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + token,
          };
          return updated;
        });
      }
    } catch (e) {
      setError(e.message);
      setMessages((prev) => prev.slice(0, -1)); // remove empty assistant bubble
    } finally {
      setThinking(false);
    }
  }, [session, thinking]);

  const reset = useCallback(async () => {
    if (session) await deleteSession(session.id);
    setSession(null);
    setMessages([]);
    setError(null);
  }, [session]);

  return { session, messages, uploading, thinking, error, upload, ask, reset };
}