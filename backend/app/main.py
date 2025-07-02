from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from .pdf_parser import extract_text_from_pdf

app = FastAPI(
    title="AI Resume Scanner API",
    version="0.1.0"
)

@app.get("/")
def health_check():
    return {"status": "active", "message": "API is running/API toimii!"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        text = extract_text_from_pdf(tmp_path)
        os.unlink(tmp_path)

        return {
            "filename": file.filename,
            "preview": text[:200] + "..." if len(text) > 200 else text,
            "char_count": len(text)
        }
    except Exception as e:
        return {"error": str(e)}
