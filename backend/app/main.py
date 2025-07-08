from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from backend.app.pdf_parser import extract_text_from_pdf
from dotenv import load_dotenv
import requests
from .config import HF_API_TOKEN, HF_MODEL

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def analyze_resume_with_ai(text: str) -> str:
    #huggingface free api to analyze pdf files
    API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

    prompt = f"""
    analyze this resume for ATS compatibility and provide:
    1. missing keywords
    2. formatting improvements
    3. ATS score (0-100)
    4. top 3 action items

    Resume:
    {text[:1500]}  # max 1500 characters
    """

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json={"inputs": prompt},
            timeout=30
        )
        response.raise_for_status()
        return response.json()[0]['generated_text']
    except Exception as e:
        return f"AI Analysis Unavailable: {str(e)}"


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are accepted")

        contents = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        text = extract_text_from_pdf(tmp_path)
        analysis = analyze_resume_with_ai(text)
        os.unlink(tmp_path)

        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(contents),
            "preview": text[:200] + "..." if len(text) > 200 else text,
            "analysis": analysis
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-test")
async def test_upload(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "received": True
    }