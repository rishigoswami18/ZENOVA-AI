import pandas as pd
import numpy as np
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import time

def train_model():
    print("Loading processed data...")
    try:
        train_df = pd.read_csv('datasource/processed/train.csv')
        val_df = pd.read_csv('datasource/processed/val.csv')
    except FileNotFoundError:
        print("ERROR: Processed data not found. Run preprocess.py first.")
        return

    # 1. Feature Representation (TF-IDF)
    print("Vectorizing text with TF-IDF...")
    # Using N-grams (1,2) to capture phrases like 'full stack' or 'data science'
    vectorizer = TfidfVectorizer(
        max_features=5000, 
        ngram_range=(1, 2),
        stop_words='english'
    )
    
    X_train = vectorizer.fit_transform(train_df['cleaned_text'])
    y_train = train_df['Category']
    
    X_val = vectorizer.transform(val_df['cleaned_text'])
    y_val = val_df['Category']

    # 2. Model Initialization
    # Logistic Regression is fast, scalable, and performs well on text with TF-IDF
    model = LogisticRegression(
        max_iter=1000, 
        class_weight='balanced', # Handles class imbalance (e.g. BPO sample size)
        random_state=42
    )

    # 3. Training
    print("Training Logistic Regression model...")
    start_time = time.time()
    model.fit(X_train, y_train)
    duration = time.time() - start_time
    print(f"Training complete in {duration:.2f} seconds.")

    # 4. Evaluation (Validation Set)
    print("\n=== Validation Set Evaluation ===")
    y_pred = model.predict(X_val)
    
    acc = accuracy_score(y_val, y_pred)
    # Baseline comparison: Majority class
    majority_class = train_df['Category'].mode()[0]
    baseline_acc = (y_val == majority_class).mean()
    
    print(f"Model Accuracy: {acc:.4f}")
    print(f"Majority Baseline Accuracy: {baseline_acc:.4f}")
    print(f"Lift over baseline: {(acc - baseline_acc):.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_val, y_pred))

    # 5. Export
    os.makedirs('models', exist_ok=True)
    joblib.dump(model, 'models/resume_classifier.pkl')
    joblib.dump(vectorizer, 'models/tfidf_vectorizer.pkl')
    print("\nModel artifacts saved to models/")

if __name__ == "__main__":
    train_model()
