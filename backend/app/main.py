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
    API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

    payload = {
        "inputs": text[:1500],     #max 1500 characters
        "parameters": {
            "candidate_labels": [
                "Technical Skills",
                "Work Experience",
                "Education",
                "Projects",
                "Certifications"
            ],
            "multi_label": True
        }
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            results = response.json()

            # analysis formatting
            analysis = []
            for label, score in zip(results['labels'], results['scores']):
                if score > 0.5:
                    analysis.append(f"{label}: {score:.0%} completeness")

            if not analysis:
                return "Analysis: Resume sections need significant improvement"

            return "Resume Section Analysis:\n" + "\n".join(analysis)

        return f"Analysis failed (HTTP {response.status_code}): {response.text[:200]}"
    except Exception as e:
        return f"Analysis error: {str(e)}"

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