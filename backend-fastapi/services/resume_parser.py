import re
import io
from PyPDF2 import PdfReader

# Comprehensive skill dictionaries by categories
SKILL_POOLS = {
    "frontend": [
        "html", "css", "javascript", "typescript", "react", "vue", "angular", 
        "next.js", "redux", "tailwind css", "bootstrap", "sass", "webpack", "vite", "sass"
    ],
    "backend": [
        "python", "node.js", "express", "fastapi", "django", "flask", "java", "spring boot", 
        "go", "golang", "c++", "c#", "ruby", "php", "rest apis", "graphql", "microservices",
        "sql", "postgresql", "mongodb", "mysql", "sqlite", "redis", "elasticsearch"
    ],
    "devops_cloud": [
        "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "jenkins", "git", 
        "github", "terraform", "ansible", "linux", "nginx"
    ],
    "ai_ml": [
        "pytorch", "tensorflow", "scikit-learn", "numpy", "pandas", "keras", 
        "nlp", "computer vision", "llms", "langchain", "llama", "huggingface", 
        "vector databases", "pinecone", "chromadb", "data science", "deep learning"
    ],
    "soft_skills": [
        "leadership", "communication", "agile", "scrum", "problem solving", 
        "teamwork", "critical thinking", "project management", "collaboration"
    ]
}

ROLE_REQUIREMENTS = {
    "AI Engineer": {
        "required": ["python", "pytorch", "tensorflow", "llms", "nlp", "vector databases", "git"],
        "preferred": ["langchain", "fastapi", "docker", "huggingface", "pandas", "numpy"]
    },
    "ML Engineer": {
        "required": ["python", "scikit-learn", "pytorch", "numpy", "pandas", "deep learning", "git"],
        "preferred": ["docker", "tensorflow", "fastapi", "sql", "ci/cd"]
    },
    "Fullstack Engineer": {
        "required": ["javascript", "typescript", "react", "node.js", "express", "sql", "git"],
        "preferred": ["next.js", "tailwind css", "docker", "aws", "postgresql", "mongodb"]
    },
    "Backend Developer": {
        "required": ["python", "node.js", "express", "sql", "postgresql", "rest apis", "git"],
        "preferred": ["fastapi", "docker", "redis", "microservices", "aws", "kubernetes"]
    },
    "Frontend Developer": {
        "required": ["html", "css", "javascript", "typescript", "react", "tailwind css", "git"],
        "preferred": ["next.js", "redux", "sass", "webpack", "vite"]
    }
}

class ResumeParser:
    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> str:
        """Extracts text from PDF or raw text bytes."""
        text = ""
        try:
            if filename.lower().endswith(".pdf"):
                pdf_file = io.BytesIO(file_bytes)
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            else:
                text = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Error extracting text: {e}")
            # Fallback to empty text
        return text

    @classmethod
    def parse_resume(cls, text: str, target_role: str = "AI Engineer") -> dict:
        """Parses resume text, extracts skills, calculates ATS scores, and provides recommendations."""
        text_lower = text.lower()
        extracted_skills = []
        
        # 1. Extract skills matching predefined categories
        category_breakdown = {}
        for category, skills in SKILL_POOLS.items():
            category_breakdown[category] = []
            for skill in skills:
                # Use word boundaries or exact phrase matching
                pattern = r'\b' + re.escape(skill) + r'\b'
                if re.search(pattern, text_lower):
                    extracted_skills.append(skill)
                    category_breakdown[category].append(skill)
                    
        extracted_skills = list(set(extracted_skills))
        
        # 2. Match against Target Role
        role_reqs = ROLE_REQUIREMENTS.get(target_role, ROLE_REQUIREMENTS["AI Engineer"])
        required_skills = role_reqs["required"]
        preferred_skills = role_reqs["preferred"]
        
        found_required = [s for s in required_skills if s in extracted_skills]
        missing_required = [s for s in required_skills if s not in extracted_skills]
        
        found_preferred = [s for s in preferred_skills if s in extracted_skills]
        missing_preferred = [s for s in preferred_skills if s not in extracted_skills]
        
        # 3. Calculate ATS Score
        # Required skills = 60% of weight, Preferred skills = 30%, Formatting & Structure = 10%
        req_score = (len(found_required) / len(required_skills)) * 60 if required_skills else 60
        pref_score = (len(found_preferred) / len(preferred_skills)) * 30 if preferred_skills else 30
        
        # Structure check: looking for sections like "Experience", "Education", "Projects"
        structure_score = 0
        sections = ["experience", "work history", "education", "projects", "skills", "summary"]
        for section in sections:
            if section in text_lower:
                structure_score += 1.67 # up to ~10 points total
        structure_score = min(structure_score, 10.0)
        
        ats_score = int(req_score + pref_score + structure_score)
        ats_score = max(10, min(ats_score, 100)) # Clamp between 10 and 100
        
        # 4. Generate prioritized improvement suggestions
        suggestions = []
        if missing_required:
            suggestions.append({
                "priority": "High",
                "message": f"Missing critical core skills required for {target_role}: {', '.join(missing_required).upper()}.",
                "action": f"Add these keywords and back them up with specific project accomplishments."
            })
        if missing_preferred:
            suggestions.append({
                "priority": "Medium",
                "message": f"Enhance your compatibility by listing preferred technical tools: {', '.join(missing_preferred).upper()}.",
                "action": f"Incorporate these tools into your project summaries or tech stack listings."
            })
        if structure_score < 7:
            suggestions.append({
                "priority": "Low",
                "message": "Resume section structure could be improved.",
                "action": "Ensure clear section headers for 'Experience', 'Education', 'Projects', and 'Skills'."
            })
            
        if not suggestions:
            suggestions.append({
                "priority": "Low",
                "message": "Your resume is highly optimized for this role!",
                "action": "Maintain clear bullet points starting with strong action verbs."
            })

        return {
            "target_role": target_role,
            "ats_score": ats_score,
            "skills_extracted": extracted_skills,
            "category_breakdown": category_breakdown,
            "skills_match": {
                "found_required": found_required,
                "missing_required": missing_required,
                "found_preferred": found_preferred,
                "missing_preferred": missing_preferred
            },
            "suggestions": suggestions
        }
