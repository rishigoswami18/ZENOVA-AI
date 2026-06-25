import pandas as pd
import re
import os
import random

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\x00-\x7f]',r' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def preprocess():
    random.seed(42)
    print("Loading data...")
    df = pd.read_csv('datasource/Resume/Resume.csv', encoding='utf-8')
    
    print("Cleaning...")
    df['cleaned_text'] = df['Resume_str'].apply(clean_text)
    df = df[df['cleaned_text'].str.len() > 0]
    
    # Simple random split if stratified is too hard
    indices = df.index.tolist()
    random.shuffle(indices)
    
    train_size = int(0.7 * len(indices))
    val_size = int(0.15 * len(indices))
    
    train_indices = indices[:train_size]
    val_indices = indices[train_size:train_size+val_size]
    test_indices = indices[train_size+val_size:]
    
    os.makedirs('datasource/processed', exist_ok=True)
    df.loc[train_indices].to_csv('datasource/processed/train.csv', index=False)
    df.loc[val_indices].to_csv('datasource/processed/val.csv', index=False)
    df.loc[test_indices].to_csv('datasource/processed/test.csv', index=False)
    
    print("DONE: Savied to datasource/processed/")

if __name__ == "__main__":
    preprocess()
