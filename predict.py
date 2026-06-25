import joblib
import re
import os

# Absolute paths for reliability in FastAPI environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'resume_classifier.pkl')
VECTORIZER_PATH = os.path.join(BASE_DIR, 'models', 'tfidf_vectorizer.pkl')

class ResumeClassifier:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        try:
            self.model = joblib.load(MODEL_PATH)
            self.vectorizer = joblib.load(VECTORIZER_PATH)
        except Exception as e:
            print(f"Error loading model artifacts: {e}")

    def _clean_text(self, text):
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'<.*?>', '', text)
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'[^\x00-\x7f]',r' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def predict(self, text):
        """
        Predicts resume category from raw text.
        Returns strict JSON-compatible dict.
        """
        if not self.model or not self.vectorizer:
            return {"error": "Model not loaded"}
        
        cleaned = self._clean_text(text)
        if not cleaned:
            return {"error": "Empty input after cleaning", "category": "UNKNOWN"}
            
        vectorized = self.vectorizer.transform([cleaned])
        prediction = self.model.predict(vectorized)[0]
        
        # Get probability scores for confidence reporting
        probs = self.model.predict_proba(vectorized)[0]
        confidence = float(max(probs))
        
        return {
            "category": prediction,
            "confidence": round(confidence, 4),
            "status": "success"
        }

# Singleton instance for production use
classifier = ResumeClassifier()

def predict(text):
    return classifier.predict(text)

if __name__ == "__main__":
    # Test case
    sample = "Experienced software engineer with skills in React, Node.js and SQL."
    print(predict(sample))
