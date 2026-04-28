from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

from rag import RAGPipeline

app = FastAPI(title="PDF Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rag = RAGPipeline()


class ChatRequest(BaseModel):
    session_id: str
    question: str


class DeleteRequest(BaseModel):
    session_id: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
def list_models():
    """Return available Ollama models."""
    return {"models": rag.list_models()}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload a PDF and index it. Returns a session_id."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:  # 50 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 50 MB).")

    session_id, num_chunks = rag.ingest(contents, file.filename)
    return {
        "session_id": session_id,
        "filename": file.filename,
        "chunks": num_chunks,
        "message": f"Indexed {num_chunks} chunks from '{file.filename}'.",
    }


@app.post("/chat")
def chat(req: ChatRequest):
    """Stream an answer to a question about the uploaded PDF."""
    if not rag.session_exists(req.session_id):
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")

    def token_stream():
        for token in rag.stream_answer(req.session_id, req.question):
            yield token

    return StreamingResponse(token_stream(), media_type="text/plain")


@app.post("/delete")
def delete_session(req: DeleteRequest):
    """Remove a session's vector store from memory."""
    rag.delete_session(req.session_id)
    return {"message": "Session deleted."}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)