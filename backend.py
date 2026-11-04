from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer, util

app = FastAPI(title="CareerMatch AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None





@app.get("/")
def home():
    return {"message": "CareerMatch AI backend is running"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
    }


@app.post("/compare")
def compare_texts(data: dict):
    global model

    if model is None:
        model = SentenceTransformer("sentence-transformers/paraphrase-MiniLM-L3-v2")

    resume_text = data.get("resume_text", "").strip()
    job_text = data.get("job_text", "").strip()

    if not resume_text or not job_text:
        return {"error": "Both resume_text and job_text are required"}

    resume_embedding = model.encode(resume_text, convert_to_tensor=True)
    job_embedding = model.encode(job_text, convert_to_tensor=True)

    similarity = util.cos_sim(resume_embedding, job_embedding).item()

    return {
        "similarity_score": round(similarity * 100, 2),
        "note": "This score measures semantic similarity, not overall job suitability.",
    }