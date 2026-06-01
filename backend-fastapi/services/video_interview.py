from services.llm_client import chat_json


FALLBACK_QUESTIONS = {
    "AI Engineer": [
        "Walk me through how you would design a production-ready RAG pipeline for enterprise documents.",
        "Tell me about a time you improved model quality or inference performance under real constraints.",
        "How would you evaluate whether an AI feature is actually delivering user value after launch?",
    ],
    "ML Engineer": [
        "Describe an ML system you would build from data ingestion through model deployment.",
        "Tell me about a time you handled model drift, poor data quality, or weak labels.",
        "How would you balance model accuracy, latency, and infrastructure cost in production?",
    ],
    "Fullstack Engineer": [
        "Walk me through a fullstack feature you shipped from UI to backend and database.",
        "Tell me about a time you debugged a difficult production issue across multiple layers.",
        "How would you design a scalable authentication flow for a modern SaaS application?",
    ],
    "Backend Developer": [
        "Describe a backend service you designed for reliability, observability, and scale.",
        "Tell me about a time you improved API latency or database performance.",
        "How would you design an event-driven workflow for a high-volume product feature?",
    ],
    "Frontend Developer": [
        "Walk me through a frontend feature where UX quality and performance both mattered.",
        "Tell me about a time you handled complex state management or async UI flows.",
        "How would you architect a responsive dashboard that stays fast with heavy data?",
    ],
}


class VideoInterviewCoach:
    @staticmethod
    def generate_session(target_role: str, interview_type: str, difficulty: str) -> dict:
        result = chat_json(
            "You are a senior interviewer creating a realistic mock video interview session. "
            "Return strict JSON with keys: interviewer_name, interviewer_style, intro_script, "
            "delivery_focus, success_criteria, questions. "
            "questions must be an array of exactly 3 objects with keys: id, question, intent, follow_up.",
            f"Target role: {target_role}\nInterview type: {interview_type}\nDifficulty: {difficulty}\n"
            "Create a concise but realistic virtual interview setup.",
        )
        if result and result.get("questions"):
            return result

        questions = FALLBACK_QUESTIONS.get(target_role, FALLBACK_QUESTIONS["AI Engineer"])
        return {
            "interviewer_name": "Jordan Lee",
            "interviewer_style": "Calm, direct, and detail-oriented hiring manager",
            "intro_script": (
                f"Welcome to your {difficulty.lower()} {interview_type.lower()} interview for the {target_role} track. "
                "Answer out loud as if you are in a real live video call. Keep your responses structured and concrete."
            ),
            "delivery_focus": [
                "Lead with a short headline before details.",
                "Use STAR for experience answers and clear architecture sequencing for technical answers.",
                "Keep your pace calm and avoid over-explaining the first minute.",
            ],
            "success_criteria": [
                "Clear structure",
                "Specific evidence",
                "Confident delivery",
                "Role-relevant technical depth",
            ],
            "questions": [
                {
                    "id": f"video_q_{index + 1}",
                    "question": question,
                    "intent": "Test clarity, depth, and communication under live interview conditions.",
                    "follow_up": "Can you make that more concrete with one production example?",
                }
                for index, question in enumerate(questions[:3])
            ],
        }

    @staticmethod
    def evaluate_answer(
        target_role: str,
        interview_type: str,
        difficulty: str,
        question: str,
        transcript: str,
        duration_seconds: int,
    ) -> dict:
        result = chat_json(
            "You are a senior interviewer grading a live virtual interview response. "
            "Return strict JSON with keys: overall_score, content_score, delivery_score, confidence_score, "
            "strengths, improvements, follow_up_question, sample_polished_answer. "
            "strengths and improvements must be arrays of short strings.",
            f"Target role: {target_role}\nInterview type: {interview_type}\nDifficulty: {difficulty}\n"
            f"Question: {question}\nDuration seconds: {duration_seconds}\nTranscript:\n{transcript}",
        )
        if result:
            result["is_real_ai"] = True
            return result

        word_count = len(transcript.split())
        structure_terms = ["first", "second", "finally", "because", "for example", "impact", "result"]
        structure_hits = sum(1 for term in structure_terms if term in transcript.lower())

        content_score = min(45 + word_count // 6, 90)
        delivery_score = min(40 + structure_hits * 6, 92)
        confidence_score = 78 if duration_seconds >= 60 else 62
        overall_score = int((content_score + delivery_score + confidence_score) / 3)

        strengths = [
            "Your answer stays focused on the prompt.",
            "You sound more interview-ready when you give concrete examples and tradeoffs.",
        ]
        improvements = [
            "Open with a one-sentence summary before expanding.",
            "Add one measurable outcome or production constraint to make the answer more credible.",
            "End with the impact of your decision rather than stopping at implementation details.",
        ]

        return {
            "overall_score": overall_score,
            "content_score": content_score,
            "delivery_score": delivery_score,
            "confidence_score": confidence_score,
            "strengths": strengths,
            "improvements": improvements,
            "follow_up_question": "What tradeoff did you consciously make, and why was it the right one?",
            "sample_polished_answer": (
                "I would start by framing the goal, constraints, and success metric. Then I would explain the design or decision path in two or three steps, "
                "ground it in one real example, and close with the measurable outcome and what I learned."
            ),
            "is_real_ai": False,
        }
