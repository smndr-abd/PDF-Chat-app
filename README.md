# PDF Chat

Chat with any PDF locally. No cloud, no API keys — everything runs on your machine.

## Stack

- **FastAPI** — REST + streaming backend
- **LangChain** — RAG pipeline
- **ChromaDB** — local vector store
- **Sentence Transformers** — local embeddings (`all-MiniLM-L6-v2`)
- **Ollama** — local LLM runner (llama3, mistral, etc.)
- **React + Vite** — chat UI

## Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running

## Setup

### 1. Pull a model with Ollama

```bash
ollama pull llama3
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:8000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Usage

1. Open `http://localhost:5173`
2. Upload a PDF in the sidebar
3. Wait for indexing (a few seconds)
4. Ask questions in the chat

## Changing the LLM

Edit `backend/rag.py` and change:

```python
DEFAULT_LLM = "llama3"  # swap for any model you have pulled
```

## Project Structure

```
pdf-chat/
├── backend/
│   ├── main.py          # FastAPI routes
│   ├── rag.py           # Ingestion, embedding, retrieval, streaming
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js           # fetch / streaming helpers
    │   ├── styles.css
    │   ├── hooks/
    │   │   └── useChat.js   # all chat state
    │   └── components/
    │       ├── Uploader.jsx
    │       ├── Message.jsx
    │       └── ChatInput.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```
