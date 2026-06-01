from typing import List

class RoadmapGenerator:
    @staticmethod
    def generate_roadmap(target_role: str, missing_skills: List[str]) -> dict:
        """Generates a structured 30/60/90-day roadmap tailored to the target role and skill gaps."""
        # Clean list of missing skills
        gaps = [s.upper() for s in missing_skills] if missing_skills else ["CORE CONCEPTS"]
        
        # Standard roadmap skeletons based on target roles
        if "AI" in target_role or "ML" in target_role or "Machine Learning" in target_role:
            roadmap = {
                "phase_30": {
                    "title": "Day 1-30: Core Fundamentals & Theory",
                    "focus": f"Master essential mathematical models and coding bases, targeting: {', '.join(gaps[:3])}.",
                    "tasks": [
                        {"id": "t1_1", "text": "Deep dive into statistical learning and multivariate calculus", "done": False},
                        {"id": "t1_2", "text": "Build custom neural network implementations using raw NumPy", "done": False},
                        {"id": "t1_3", "text": "Master PyTorch autograd engine and tensor manipulation APIs", "done": False},
                        {"id": "t1_4", "text": "Read the landmark Attention Is All You Need paper and map architecture", "done": False}
                    ],
                    "courses": [
                        "Andrew Ng's Machine Learning Specialization (Coursera)",
                        "Deep Learning Specialization (deeplearning.ai)"
                    ],
                    "project": "Build and train a fully custom Transformer model from scratch on small texts."
                },
                "phase_60": {
                    "title": "Day 31-60: Advanced Core & Application",
                    "focus": f"Implement state-of-the-art NLP/LLM engineering methods, focusing on: {', '.join(gaps[3:6]) if len(gaps) > 3 else 'RAG and Fine-tuning'}.",
                    "tasks": [
                        {"id": "t2_1", "text": "Build a multi-source Retrieval Augmented Generation (RAG) system", "done": False},
                        {"id": "t2_2", "text": "Implement prompt engineering design patterns (Few-shot, ReAct, Chain of Thought)", "done": False},
                        {"id": "t2_3", "text": "Fine-tune a quantized open-source LLM (Llama-3 or Mistral) using LoRA", "done": False},
                        {"id": "t2_4", "text": "Design efficient vector search indexes with semantic similarity filters", "done": False}
                    ],
                    "courses": [
                        "LangChain for LLM Application Development (DeepLearning.AI)",
                        "Hugging Face NLP Course (Free / HuggingFace.co)"
                    ],
                    "project": "Develop an interactive AI Agent utilizing semantic retrieval, structured agent memories, and API integrations."
                },
                "phase_90": {
                    "title": "Day 61-90: Production, Systems & Scale",
                    "focus": "Deploy, optimize latency, and prepare high-performance deployment systems.",
                    "tasks": [
                        {"id": "t3_1", "text": "Deploy real-time AI models using FastAPI, Docker, and Triton Server", "done": False},
                        {"id": "t3_2", "text": "Optimize inference speeds via quantization, ONNX execution, or TensorRT", "done": False},
                        {"id": "t3_3", "text": "Implement LLM guardrails, latency tracing, and token monitoring logs", "done": False},
                        {"id": "t3_4", "text": "Draft a high-quality portfolio writeup and push production repository code to GitHub", "done": False}
                    ],
                    "courses": [
                        "Full Stack Deep Learning (fullstackdeeplearning.com)",
                        "MLOps Zoomcamp (DataTalks.Club)"
                    ],
                    "project": "Launch a live, public, containerized AI Service showing real-time streaming answers and performance analytics."
                }
            }
        else:
            # Default Software Engineer/Web Developer Roadmap
            roadmap = {
                "phase_30": {
                    "title": "Day 1-30: Advanced Core & Frameworks",
                    "focus": f"Solidify core engineering principles and structure: {', '.join(gaps[:3])}.",
                    "tasks": [
                        {"id": "t1_1", "text": "Master core architectural designs (MVC, micro-frontends, layered code)", "done": False},
                        {"id": "t1_2", "text": "Implement secure routing and robust state structures", "done": False},
                        {"id": "t1_3", "text": "Refactor asynchronous calls and implement custom UI event systems", "done": False},
                        {"id": "t1_4", "text": "Design custom data structures and solve 30 medium Algorithmic exercises", "done": False}
                    ],
                    "courses": [
                        "Frontend/Backend Engineering Paths (Frontend Masters or Academind)",
                        "Designing Data-Intensive Applications (Book)"
                    ],
                    "project": "Build an elegant, optimized state dashboard containing complex data visuals and interactive tools."
                },
                "phase_60": {
                    "title": "Day 31-60: High-Performance Database & APIs",
                    "focus": f"Build efficient API structures and secure data layers: {', '.join(gaps[3:6]) if len(gaps) > 3 else 'SQL & Express Gateway'}.",
                    "tasks": [
                        {"id": "t2_1", "text": "Design highly normalized relational tables and index queries", "done": False},
                        {"id": "t2_2", "text": "Implement JWT multi-tier authentication with secure cookie sessions", "done": False},
                        {"id": "t2_3", "text": "Establish REST standards and set up real-time server-sent events", "done": False},
                        {"id": "t2_4", "text": "Build unit test suites ensuring coverage of core controllers", "done": False}
                    ],
                    "courses": [
                        "Node.js, Express, MongoDB & More (Udemy)",
                        "SQL & Database Design Masterclass"
                    ],
                    "project": "Develop a real-time collaborative platform with user workspace syncing and database triggers."
                },
                "phase_90": {
                    "title": "Day 61-90: DevOps, Deployment & Security",
                    "focus": "Automate server deployment pipelines and optimize assets for speed.",
                    "tasks": [
                        {"id": "t3_1", "text": "Create Docker files and construct multi-stage container structures", "done": False},
                        {"id": "t3_2", "text": "Deploy to cloud servers with load balancing, SSL, and DNS configs", "done": False},
                        {"id": "t3_3", "text": "Formulate CI/CD pipelines validating lint limits and testing", "done": False},
                        {"id": "t3_4", "text": "Perform web speed audits to achieve >90 score on Google Lighthouse", "done": False}
                    ],
                    "courses": [
                        "Docker & Kubernetes: The Complete Guide (Udemy)",
                        "AWS Cloud Practitioner / DevOps Foundations"
                    ],
                    "project": "Deploy containerized multi-service app with full CI/CD deployment pipelines."
                }
            }
            
        return {
            "target_role": target_role,
            "roadmap": roadmap
        }
