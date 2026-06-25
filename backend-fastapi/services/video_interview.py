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
    "Data Scientist": [
        "How do you deal with highly imbalanced classes in a classification dataset?",
        "Tell me about a time you had to explain a complex machine learning model to business partners.",
        "How would you design an A/B test to evaluate a new recommendation feature?"
    ],
    "DevOps Engineer": [
        "Walk me through how you would set up a blue-green deployment pipeline for a high-availability service.",
        "Tell me about a time you debugged a major network configuration or infrastructure bottleneck.",
        "How do you manage secret configurations securely across multi-container cloud deployments?"
    ],
    "QA Engineer": [
        "How do you design a comprehensive regression testing plan for a fast-releasing SaaS product?",
        "Tell me about a time you caught a critical edge case during integration checks.",
        "How would you automate testing of a highly dynamic dashboard containing asynchronous charts?"
    ],
    "Product Manager": [
        "How do you resolve prioritization conflicts when engineering, design, and sales demand different features?",
        "Describe how you would measure the success and adoption metrics of a newly launched workspace feature.",
        "Walk me through a time you had to pivot a product's direction based on customer feedback."
    ],
    "UI/UX Designer": [
        "Walk me through your design process from initial user research down to hi-fi interactive prototypes.",
        "How do you handle critique from developers or business owners that conflicts with user experience guidelines?",
        "Describe how you would design an inclusive, highly accessible complex checkout screen."
    ],
    "Data Analyst": [
        "What is your approach to cleaning messy, unstructured data before running aggregations?",
        "Describe a time when your analytical insights directly drove a key business decision.",
        "How do you design a high-level dashboard to ensure it remains clean, clear, and actionable for executives?"
    ],
    "HR Manager": [
        "How do you resolve conflict between a manager and their direct report regarding performance expectations?",
        "Describe your strategy for sourcing and building a diverse candidate pipeline for hard-to-fill tech roles.",
        "Walk me through how you design an onboarding process that maximizes initial employee retention."
    ],
    "Marketing Manager": [
        "How would you design a launch campaign for a new SaaS product on a constrained budget?",
        "Describe a time you used data analytics to pivot a failing growth marketing campaign.",
        "How do you maintain brand voice and messaging consistency across multiple digital channels?"
    ],
    "Sales Representative": [
        "How do you handle pricing objections from a high-value enterprise prospect?",
        "Describe a time you won back a lost client or closed a deal that was stalled for months.",
        "What is your process for researching and qualifying leads before making cold outreach?"
    ],
    "Operations Specialist": [
        "How do you identify bottlenecks in an existing administrative or internal onboarding process?",
        "Describe a time you managed a major cross-departmental initiative under tight deadlines.",
        "How would you build a framework to measure and report team productivity to leadership?"
    ]
}


class VideoInterviewCoach:
    @staticmethod
    async def generate_session(target_role: str, interview_type: str, difficulty: str) -> dict:
        result = await chat_json(
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
    async def evaluate_answer(
        target_role: str,
        interview_type: str,
        difficulty: str,
        question: str,
        transcript: str,
        duration_seconds: int,
    ) -> dict:
        result = await chat_json(
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
