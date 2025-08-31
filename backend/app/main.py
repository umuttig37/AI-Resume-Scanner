from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from backend.app.pdf_parser import extract_text_from_pdf
from dotenv import load_dotenv
import requests
from .config import HF_API_TOKEN, HF_MODEL, SECTION_WEIGHTS

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def analyze_resume_with_ai(text: str) -> dict:
    API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

    payload = {
        "inputs": text[:1500],  # max 1500 characters
        "parameters": {
            "candidate_labels": list(SECTION_WEIGHTS.keys()),
            "multi_label": True
        }
    }

    try:
        # API request
        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            results = response.json()

            section_scores = {
                label: results['scores'][i] if i < len(results['scores']) else 0.0
                for i, label in enumerate(SECTION_WEIGHTS.keys())
            }

            return {
                "section_scores": section_scores,
                "ats_score": calculate_ats_score(section_scores),
                "analysis": format_analysis(section_scores),
                "error": None
            }

        return {
            "section_scores": {},
            "ats_score": 0,
            "analysis": "",
            "error": f"huggingFace API Error ({response.status_code}): {response.text[:200]}"
        }

    except Exception as e:
        return {
            "section_scores": {},
            "ats_score": 0,
            "analysis": "",
            "error": f"analysis failed: {str(e)}"
        }


def calculate_ats_score(section_scores: dict) -> int:
    return min(100, int(sum(
        score * SECTION_WEIGHTS.get(label, 0)
        for label, score in section_scores.items()
    ) * 100))

def format_analysis(scores: dict) -> str:
    analysis = []
    for section, score in scores.items():
        strength = (
            "Strong" if score >= 0.8
            else "Medium" if score >= 0.5
            else "Weak"
        )
        analysis.append(f"{strength} {section} ({int(score*100)}%)")
    return "\n".join(analysis)

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
        os.unlink(tmp_path)
        analysis = analyze_resume_with_ai(text)

        if analysis.get("error"):
            return {"status": "error", "message": analysis["error"]}

        return {
            "filename": file.filename,
            "preview": text[:200] + "..." if len(text) > 200 else text,
            **analysis
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