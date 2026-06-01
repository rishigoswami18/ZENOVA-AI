import re
from typing import List

class JobMatcher:
    @staticmethod
    def calculate_match(resume_skills: List[str], job_description: str, job_title: str) -> dict:
        """Calculates match percentage and lists found and missing skills between resume and job."""
        desc_lower = job_description.lower()
        title_lower = job_title.lower()
        
        # Comprehensive tech keywords to scan from job description
        tech_words = [
            "python", "pytorch", "tensorflow", "scikit-learn", "numpy", "pandas",
            "javascript", "typescript", "react", "node.js", "express", "fastapi",
            "django", "flask", "next.js", "tailwind css", "bootstrap", "sass",
            "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "jenkins",
            "git", "github", "terraform", "ansible", "sql", "postgresql",
            "mongodb", "mysql", "redis", "elasticsearch", "llms", "langchain",
            "nlp", "computer vision", "huggingface", "vector databases", "agile", "scrum"
        ]
        
        # Identify required skills mentioned in the job description
        job_skills = []
        for word in tech_words:
            pattern = r'\b' + re.escape(word) + r'\b'
            if re.search(pattern, desc_lower) or re.search(pattern, title_lower):
                job_skills.append(word)
                
        # Handle case where job description doesn't explicitly name a lot of tech words
        if not job_skills:
            # Provide some default expected skills based on title keywords
            if "ai" in title_lower or "ml" in title_lower or "machine learning" in title_lower:
                job_skills = ["python", "pytorch", "tensorflow", "scikit-learn", "llms", "nlp"]
            elif "frontend" in title_lower:
                job_skills = ["javascript", "typescript", "react", "html", "css", "tailwind css"]
            elif "fullstack" in title_lower or "full stack" in title_lower:
                job_skills = ["javascript", "typescript", "react", "node.js", "express", "sql"]
            else:
                job_skills = ["python", "javascript", "git", "sql", "rest apis"]

        job_skills = list(set(job_skills))
        
        # Calculate overlap
        matching_skills = [s for s in job_skills if s in resume_skills]
        missing_skills = [s for s in job_skills if s not in resume_skills]
        
        # Match score calculation
        if len(job_skills) > 0:
            match_percentage = int((len(matching_skills) / len(job_skills)) * 100)
        else:
            match_percentage = 60 # baseline
            
        # Add some variation based on job title match
        title_keywords = title_lower.split()
        title_matches = 0
        for kw in title_keywords:
            if len(kw) > 2 and kw in " ".join(resume_skills).lower():
                title_matches += 1
        if title_matches > 0:
            match_percentage = min(match_percentage + 10, 100)
            
        match_percentage = max(10, min(match_percentage, 100))
        
        # Tailor suggestions
        tailor_suggestions = []
        if missing_skills:
            for skill in missing_skills[:3]:
                tailor_suggestions.append(
                    f"Incorporate your experience with '{skill.upper()}' by describing a project where you solved problems using it."
                )
        else:
            tailor_suggestions.append("Your skill set aligns perfectly with this job description. Focus on demonstrating business impact in your application.")
            
        return {
            "match_percentage": match_percentage,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "tailor_suggestions": tailor_suggestions
        }
