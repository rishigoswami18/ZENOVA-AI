import sys
import os

# Include parent directory to resolve imports in test run
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.resume_parser import ResumeParser
from services.matcher import JobMatcher

def test_resume_parser_score():
    sample_text = "Experienced Python developer with PyTorch, NLP, and Git skills. Worked on LLMs."
    report = ResumeParser.parse_resume(sample_text, "AI Engineer")
    assert "ats_score" in report
    assert report["ats_score"] > 30
    assert "python" in report["skills_extracted"]
    assert "pytorch" in report["skills_extracted"]

def test_job_matcher():
    skills = ["python", "react"]
    description = "We are seeking a Python developer with experience in Git."
    match = JobMatcher.calculate_match(skills, description, "Software Engineer")
    assert "match_percentage" in match
    assert "python" in match["matching_skills"]
