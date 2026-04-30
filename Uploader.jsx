import { useRef, useState } from "react";

export default function Uploader({ onUpload, uploading }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    if (file && file.type === "application/pdf") onUpload(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="uploader-wrap">
      <div
        className={`drop-zone ${dragging ? "dragging" : ""} ${uploading ? "loading" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload a PDF"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {uploading ? (
          <>
            <div className="spinner" />
            <p className="drop-label">Indexing PDF…</p>
          </>
        ) : (
          <>
            <div className="drop-icon">
              <PDFIcon />
            </div>
            <p className="drop-label">Drop a PDF here</p>
            <p className="drop-sub">or click to browse — max 50 MB</p>
          </>
        )}
      </div>
    </div>
  );
}

function PDFIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
      <polyline points="9,9 10,9 10,9" />
    </svg>
  );
}