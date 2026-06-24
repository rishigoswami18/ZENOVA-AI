import re

from services.llm_client import chat_json

# Preset list of high-quality sample questions, keywords, model answers, and omissions
INTERVIEW_DATA = {
    "Explain standard Transformer attention mechanism.": {
        "keywords": ["query", "key", "value", "softmax", "dimension", "scaling factor", "dot product", "self-attention"],
        "model": "The Transformer attention mechanism uses scaled dot-product self-attention. For an input, we project representations into three vectors: Query (Q), Key (K), and Value (V). We calculate the dot product of Q and K, scale it by the square root of the head dimension (d_k) to prevent vanishing gradients in softmax, apply a softmax function to obtain attention weights, and multiply these weights by V. Mathematically: Attention(Q,K,V) = softmax( (Q * K^T) / sqrt(d_k) ) * V.",
        "omissions": "Failing to explain why scaling by sqrt(d_k) is necessary, or forgetting to mention how Query, Key, and Value vectors map from input tokens."
    },
    "How does Retrieval-Augmented Generation (RAG) resolve LLM hallucination?": {
        "keywords": ["retrieval", "vector database", "embeddings", "context window", "external knowledge", "hallucination", "chunks"],
        "model": "RAG resolves LLM hallucination by augmenting the prompt with verified, relevant external document chunks. Instead of relying solely on the pre-trained weights of the model, an embedding is created for the query, which searches a Vector Database (like Pinecone/Chroma) to find top matching chunks. These chunks are pasted into the model's context window as 'ground truth' reference. The LLM is then instructed to answer the prompt strictly using only the supplied context, grounding its output and eliminating guess-based hallucinations.",
        "omissions": "Neglecting to detail the vector similarity lookup step or how chunking/embedding pipelines are run prior to sending the query to the LLM."
    },
    "Describe the difference between fine-tuning and prompt engineering.": {
        "keywords": ["weights", "parameters", "prompt", "context window", "gradients", "in-context learning", "training data"],
        "model": "Fine-tuning modifies the internal weights and parameters of the neural network using backpropagation and gradient descent on specialized training datasets. Prompt engineering, conversely, does not change the model weights; it guides model completion via 'in-context learning' by altering the instruction text inside the context window. Fine-tuning is best for teaching custom styles/formats or deep domain patterns, whereas prompt engineering is best for quick prototyping and tasks with strict factual constraints.",
        "omissions": "Omitting the detail that fine-tuning runs backpropagation to update actual model parameters, whereas prompt engineering is runtime-only."
    },
    "Explain Difference between SQL and NoSQL databases.": {
        "keywords": ["schema", "relational", "acid", "document", "scale", "joins", "horizontal", "vertical"],
        "model": "SQL databases are relational, table-based, and enforce strict, pre-defined schemas. They are highly normalized, support complex JOIN operations, and guarantee strict ACID compliance (Atomicity, Consistency, Isolation, Durability), making them excellent for transactional systems. NoSQL databases are non-relational, schema-flexible, and store data in document, key-value, column, or graph structures. They trade complex joins for high-speed write speeds and horizontal scalability across multiple servers.",
        "omissions": "Failing to mention vertical vs. horizontal scalability models, or neglecting to discuss table normalization vs. denormalized document shapes."
    },
    "What is JWT and how does it securely handle authentication?": {
        "keywords": ["header", "payload", "signature", "hmac", "secret key", "stateless", "claims", "bearer"],
        "model": "JSON Web Token (JWT) is an open standard (RFC 7519) that defines a compact and self-contained way for securely transmitting information as a JSON object. It consists of three parts separated by dots: Header (algorithm), Payload (user claims), and Signature. The signature is created by hashing the encoded Header, encoded Payload, and a private secret key. It provides stateless authentication because the server doesn't store session states; instead, the server verifies the integrity of the JWT sent in the HTTP Bearer header using the secret key.",
        "omissions": "Not clarifying that JWTs are typically base64url-encoded and thus readable by anyone; their security lies in integrity verification (signature), not data encryption (unless JWE is used)."
    }
}

class InterviewGrader:
    @classmethod
    async def grade_answer(cls, question: str, user_answer: str, target_role: str, difficulty: str) -> dict:
        """Grades an interview answer, falling forward to LLM if key is present, otherwise using NLP keywords."""
        result = await chat_json(
            "You are a professional technical interviewer. Grade the user's technical answer out of 100. "
            "Provide feedback with: 1) Score, 2) Strengths, 3) Weaknesses/Omissions, 4) Model Answer. "
            "Return strict JSON with keys: score, strengths, omissions, model_answer.",
            f"Role: {target_role}\nDifficulty: {difficulty}\nQuestion: {question}\nUser Answer: {user_answer}",
        )
        if result:
            return {
                "score": result.get("score", 70),
                "strengths": result.get("strengths", "Good try."),
                "omissions": result.get("omissions", "Minor details missed."),
                "model_answer": result.get("model_answer", "N/A"),
                "is_real_ai": True,
            }

        # Local NLP scoring & feedback engine
        # Find matching details in INTERVIEW_DATA
        db_match = None
        for q_key, data in INTERVIEW_DATA.items():
            if q_key.lower() in question.lower() or question.lower() in q_key.lower():
                db_match = data
                break
                
        # Generate heuristics
        user_lower = user_answer.lower()
        word_count = len(user_answer.split())
        
        if word_count < 10:
            return {
                "score": 15,
                "strengths": "You provided an extremely brief response.",
                "omissions": "Your answer is too short to evaluate. Please provide a detailed response covering the underlying concepts, architectural layers, or mechanics.",
                "model_answer": db_match["model"] if db_match else "Provide a comprehensive explanation covering technical mechanics.",
                "is_real_ai": False
            }
            
        # Core keyword checks
        matched_keywords = []
        missing_keywords = []
        
        if db_match:
            keywords = db_match["keywords"]
            model_answer = db_match["model"]
            omissions_feedback = db_match["omissions"]
        else:
            # Dynamically compile standard tech buzzwords
            keywords = ["architecture", "scale", "performance", "optimization", "security", "mechanism", "protocol", "implementation"]
            model_answer = "Provide a structured technical definition: 1) State what the technology is, 2) Detail how it works step-by-step, 3) Highlight its main tradeoffs (scaling/latency/cost)."
            omissions_feedback = "Ensure you explicitly outline architectural tradeoffs, error states, and deployment constraints."

        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', user_lower):
                matched_keywords.append(kw)
            else:
                missing_keywords.append(kw)
                
        # Scoring components:
        # Keyword Coverage (up to 50 points)
        keyword_pct = len(matched_keywords) / len(keywords) if keywords else 1.0
        keyword_score = keyword_pct * 50
        
        # Answer Length / Depth (up to 30 points)
        depth_score = min(word_count / 150, 1.0) * 30
        
        # Structure score (up to 20 points): checking for complex transitions or bullet structures
        structure_score = 0
        indicators = ["firstly", "secondly", "however", "therefore", "because", "such as", "for example", "-", "•"]
        for ind in indicators:
            if ind in user_lower:
                structure_score += 4
        structure_score = min(structure_score, 20)
        
        total_score = int(keyword_score + depth_score + structure_score)
        
        # Add modifier based on difficulty
        if difficulty.lower() == "hard":
            # Higher standard, damp score slightly
            total_score = int(total_score * 0.9)
        elif difficulty.lower() == "easy":
            # Lower standard, boost score
            total_score = int(total_score * 1.1)
            
        total_score = max(20, min(total_score, 98)) # Clamp between 20 and 98
        
        # Generate feedback text
        strengths = []
        if matched_keywords:
            strengths.append(f"Great inclusion of technical terminology: {', '.join(matched_keywords).upper()}.")
        if word_count > 60:
            strengths.append("Excellent length and descriptive effort. You structure the concepts sequentially.")
        else:
            strengths.append("Clear syntax, though the answer could benefit from deeper conceptual elaboration.")
            
        omissions = []
        if missing_keywords:
            omissions.append(f"Consider integrating technical keywords: {', '.join(missing_keywords[:3]).upper()}.")
        if db_match:
            omissions.append(omissions_feedback)
        else:
            omissions.append("To elevate this to FAANG level, cover runtime time/space complexity or system resource constraints.")
            
        return {
            "score": total_score,
            "strengths": " ".join(strengths),
            "omissions": " ".join(omissions),
            "model_answer": model_answer,
            "is_real_ai": False
        }
