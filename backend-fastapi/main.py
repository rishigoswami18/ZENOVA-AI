import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from dotenv import load_dotenv

# Load configurations
load_dotenv()

# Import services
from services.resume_parser import ResumeParser
from services.matcher import JobMatcher
from services.roadmap import RoadmapGenerator
from services.grader import InterviewGrader
from services.llm_client import chat_text
from services.video_interview import VideoInterviewCoach

app = FastAPI(title="ZENOVA AI Engine", version="1.0.0")

# Enable CORS for frontend and Express gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Models
class MatchJobRequest(BaseModel):
    resume_skills: List[str]
    job_title: str
    job_description: str

class GenerateRoadmapRequest(BaseModel):
    target_role: str
    missing_skills: List[str]

class GradeInterviewRequest(BaseModel):
    question: str
    user_answer: str
    target_role: str
    difficulty: str


class GenerateVideoInterviewRequest(BaseModel):
    target_role: str
    interview_type: str
    difficulty: str


class GradeVideoInterviewRequest(BaseModel):
    question: str
    transcript: str
    target_role: str
    interview_type: str
    difficulty: str
    duration_seconds: int

class ChatMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class CoachChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]
    topic: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "online", "service": "ZENOVA AI NLP Engine"}

@app.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    target_role: str = Form("AI Engineer")
):
    """Parses a resume PDF/Text and calculates ATS keywords matching."""
    try:
        file_bytes = await file.read()
        text = ResumeParser.extract_text(file_bytes, file.filename)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Unable to extract text from the file. Ensure the file is not corrupted.")
            
        report = ResumeParser.parse_resume(text, target_role)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

@app.post("/match-job")
def match_job(req: MatchJobRequest):
    """Calculates resume skill matches against specific jobs."""
    try:
        report = JobMatcher.calculate_match(req.resume_skills, req.job_description, req.job_title)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate job matches: {str(e)}")

@app.post("/generate-roadmap")
def generate_roadmap(req: GenerateRoadmapRequest):
    """Generates structured career learning roadmap."""
    try:
        roadmap = RoadmapGenerator.generate_roadmap(req.target_role, req.missing_skills)
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile learning roadmap: {str(e)}")

@app.post("/grade-interview")
def grade_interview(req: GradeInterviewRequest):
    """Grades mock interview answers."""
    try:
        evaluation = InterviewGrader.grade_answer(
            req.question, req.user_answer, req.target_role, req.difficulty
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to grade answer: {str(e)}")


@app.post("/video-interview/session")
def generate_video_interview(req: GenerateVideoInterviewRequest):
    try:
        session = VideoInterviewCoach.generate_session(
            req.target_role, req.interview_type, req.difficulty
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate video interview: {str(e)}")


@app.post("/video-interview/evaluate")
def evaluate_video_interview(req: GradeVideoInterviewRequest):
    try:
        evaluation = VideoInterviewCoach.evaluate_answer(
            req.target_role,
            req.interview_type,
            req.difficulty,
            req.question,
            req.transcript,
            req.duration_seconds,
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate video interview: {str(e)}")

@app.post("/coach-chat")
def coach_chat(req: CoachChatRequest):
    """Conversational AI career coaching agent."""
    msg = req.message.lower()

    history_text = "\n".join(
        f"{item.role}: {item.content}" for item in req.history[-8:]
    )
    topic_text = req.topic or "general career coaching"

    llm_reply = chat_text(
        "You are an elite AI career coach for software, data, and AI roles. Give practical, encouraging, concise advice. "
        "Use bullets only when they genuinely help. If the user asks for scripts, provide a ready-to-send draft.",
        f"Topic: {topic_text}\nConversation history:\n{history_text}\n\nLatest user message:\n{req.message}",
        temperature=0.6,
    )
    if llm_reply:
        return {"response": llm_reply}
    
    # Smart response routing based on topics and keywords
    if "salary" in msg or "negotiat" in msg or "compensation" in msg:
        reply = (
            "When negotiating salary, follow these core principles:\n\n"
            "1. **Never state a number first**: Let the recruiter offer the range. If pressed, say: 'I'm open to competitive compensation aligned with the value and market standards for this seniority.'\n"
            "2. **Use leverage**: Cite specific market data (from Levels.fyi or Glassdoor) or alternative active offers.\n"
            "3. **Evaluate the whole package**: Sign-on bonuses, equity (RSUs), remote work equity, and wellness stipends have huge compounding value.\n\n"
            "Would you like me to help you draft a specific response script to a salary offer?"
        )
    elif "faang" in msg or "interview prep" in msg or "google" in msg or "meta" in msg:
        reply = (
            "FAANG interview loops are highly structured. Here is a baseline checklist:\n\n"
            "- **Algorithms (Data Structures)**: Master depth-first search (DFS), BFS, binary search, tree traversals, dynamic programming (1D/2D), and heap-based solutions. Focus on explaining time and space complexity clearly (Big O).\n"
            "- **System Design**: For mid-to-senior levels, understand horizontal scaling, load balancing, CDNs, database sharding, message queues, and CAP theorem trade-offs.\n"
            "- **Behavioral**: Structure your stories strictly using the **STAR** method (Situation, Task, Action, Result). Highlight individual technical contributions and engineering leadership.\n\n"
            "I can generate a sample algorithm or behavioral question for you to practice. What would you prefer?"
        )
    elif "resume" in msg or "ats" in msg or "format" in msg:
        reply = (
            "To optimize your resume for ATS algorithms and recruiters:\n\n"
            "- **Format simply**: Use a single-column layout with clean fonts. Avoid complex table structures, floating icons, or visual graphs which confuse parsing software.\n"
            "- **Action Verbs + Metrics**: Every bullet should follow the formula: *Accomplished [X] as measured by [Y] by implementing [Z]*. (e.g., 'Reduced query latency by 45% by indexing critical Postgres tables').\n"
            "- **Keywords Alignment**: Proactively place exact tool names (e.g. React, Docker, PyTorch) inside your bullet points rather than grouping them only in a static footer list.\n\n"
            "Feel free to upload your resume in the **Resume Analyzer** module to get a complete keyword gap breakdown!"
        )
    elif "project" in msg or "portfolio" in msg or "idea" in msg:
        reply = (
            "Here are three premium project ideas that stand out on engineering portfolios:\n\n"
            "1. **Real-time Vector Search RAG Service**: A containerized microservice that ingests document files, chunks text, creates embeddings using a local HuggingFace model, index searches in ChromaDB, and returns structured API responses via FastAPI.\n"
            "2. **Collaborative Multi-user Design Canvas**: A React application featuring real-time state synchronization via WebSockets, persistent backend store in Node.js, and offline sync backups.\n"
            "3. **Kubernetes ML Inference Suite**: A containerized Python inference API utilizing Triton or ONNX, load balanced with auto-scaling metrics, and monitored using Prometheus dashboard metrics.\n\n"
            "Which one matches your career goal? I can help you outline the exact folder structure and codebase files!"
        )
    else:
        reply = (
            "Hello! I am your ZENOVA AI career copilot. I can guide you through every stage of your job hunt:\n\n"
            "- 📊 **Resume Optimization**: I'll review key phrases and give you ATS scoring updates.\n"
            "- 💼 **Job Tailoring**: I'll explain how to customize your applications for target roles.\n"
            "- 🧠 **Mock Interviews**: I'll grade your technical answers and supply high-scoring model responses.\n"
            "- 📈 **Salary Negotiations**: I'll outline specific negotiation scripts.\n\n"
            "How can I help you accelerate your career path today?"
        )
        
    return {"response": reply}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)
