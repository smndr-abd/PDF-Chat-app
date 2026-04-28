import uuid
import io
from typing import Generator

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaLLM
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
import tempfile
import os
import subprocess


EMBED_MODEL = "all-MiniLM-L6-v2"   # runs locally, no API key
DEFAULT_LLM  = "llama3"             # change to any model you have pulled

PROMPT_TEMPLATE = """You are a helpful assistant that answers questions strictly based on the provided PDF context.
If the answer is not in the context, say "I couldn't find that information in the document."

Context:
{context}

Question: {question}

Answer:"""


class RAGPipeline:
    def __init__(self):
        self.embeddings = SentenceTransformerEmbeddings(model_name=EMBED_MODEL)
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        # session_id -> Chroma vectorstore
        self._stores: dict[str, Chroma] = {}

    # ── Ingestion ─────────────────────────────────────────────────────────────

    def ingest(self, pdf_bytes: bytes, filename: str) -> tuple[str, int]:
        """Parse PDF, chunk, embed and store. Returns (session_id, chunk_count)."""
        # Write bytes to a temp file so PyPDFLoader can read it
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        try:
            loader = PyPDFLoader(tmp_path)
            pages = loader.load()
        finally:
            os.unlink(tmp_path)

        if not pages:
            raise ValueError("Could not extract text from PDF.")

        chunks = self.splitter.split_documents(pages)

        session_id = str(uuid.uuid4())
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            collection_name=session_id,
        )
        self._stores[session_id] = vectorstore
        return session_id, len(chunks)

    # ── Retrieval + Generation ────────────────────────────────────────────────

    def stream_answer(self, session_id: str, question: str) -> Generator[str, None, None]:
        """Retrieve relevant chunks and stream the LLM answer token by token."""
        vectorstore = self._stores[session_id]
        retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

        llm = OllamaLLM(model=DEFAULT_LLM, temperature=0.2, streaming=True)

        prompt = PromptTemplate(
            template=PROMPT_TEMPLATE,
            input_variables=["context", "question"],
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": prompt},
        )

        # Stream tokens
        for chunk in llm.stream(
            prompt.format(
                context=_format_docs(retriever.get_relevant_documents(question)),
                question=question,
            )
        ):
            yield chunk

    # ── Utilities ─────────────────────────────────────────────────────────────

    def session_exists(self, session_id: str) -> bool:
        return session_id in self._stores

    def delete_session(self, session_id: str):
        if session_id in self._stores:
            self._stores[session_id].delete_collection()
            del self._stores[session_id]

    def list_models(self) -> list[str]:
        """Ask Ollama which models are available locally."""
        try:
            result = subprocess.run(
                ["ollama", "list"], capture_output=True, text=True, timeout=5
            )
            lines = result.stdout.strip().splitlines()[1:]  # skip header
            return [line.split()[0] for line in lines if line.strip()]
        except Exception:
            return [DEFAULT_LLM]


def _format_docs(docs) -> str:
    return "\n\n".join(
        f"[Page {doc.metadata.get('page', '?')+1}]\n{doc.page_content}" for doc in docs
    )