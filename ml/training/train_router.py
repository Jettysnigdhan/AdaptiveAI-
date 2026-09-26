import json
import os
import sys
from pathlib import Path
import numpy as np
import joblib

# Ensure root workspace is on python sys.path
root_dir = Path(__file__).resolve().parents[2]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from backend.app.analyzer.prompt_analyzer import analyzer
from backend.app.core.logging import logger

DATA_PATH = Path("./ml/data/benchmarks/benchmark_prompts.json")
MODEL_DIR = Path("./ml/models/trained")
REPORT_DIR = Path("./evaluation/reports")


def train_and_evaluate():
    print("=" * 65)
    print("  AdaptiveRoute - ML Router Training & Evaluation Pipeline")
    print("=" * 65)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} benchmark samples across tiers.")

    X = []
    y = []

    print("Extracting 395-dimensional feature vectors (Embeddings + Domain signals)...")
    for item in data:
        prompt = item["prompt"]
        tier = item["target_tier"]
        analysis = analyzer.analyze(prompt)
        feat_vec = analysis.get_full_feature_vector()
        X.append(feat_vec)
        y.append(tier)

    X = np.array(X, dtype=np.float32)
    y = np.array(y)

    print(f"Dataset matrix shape: {X.shape}, Labels: {np.unique(y, return_counts=True)}")

    # Model 1: Logistic Regression
    lr = LogisticRegression(max_iter=1000, C=1.0, random_state=42)
    # Model 2: Random Forest
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)

    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

    lr_scores = cross_val_score(lr, X, y, cv=cv, scoring="accuracy")
    rf_scores = cross_val_score(rf, X, y, cv=cv, scoring="accuracy")

    print(f"\n--- Cross-Validation Results (3-Fold) ---")
    print(f"1. Logistic Regression : {lr_scores.mean()*100:.1f}% (+/- {lr_scores.std()*100:.1f}%)")
    print(f"2. Random Forest        : {rf_scores.mean()*100:.1f}% (+/- {rf_scores.std()*100:.1f}%)")

    # Select best model
    if rf_scores.mean() >= lr_scores.mean():
        best_name = "RandomForest"
        best_model = rf
        best_score = rf_scores.mean()
    else:
        best_name = "LogisticRegression"
        best_model = lr
        best_score = lr_scores.mean()

    # Fit best model on complete dataset
    best_model.fit(X, y)
    y_pred = best_model.predict(X)
    train_acc = accuracy_score(y, y_pred)
    report_dict = classification_report(y, y_pred, output_dict=True)

    print(f"\nBest Model Selected: {best_name} (Train Accuracy: {train_acc*100:.1f}%)")

    # Save artifact
    output_file = MODEL_DIR / "router_model.joblib"
    joblib.dump(best_model, output_file)
    print(f"Saved trained router weights -> {output_file}")

    # Save evaluation report
    report_file = REPORT_DIR / "router_training_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "best_model": best_name,
            "cv_accuracy_mean": round(float(best_score), 4),
            "train_accuracy": round(float(train_acc), 4),
            "classes": best_model.classes_.tolist(),
            "n_samples": len(data),
            "feature_dim": X.shape[1],
            "classification_report": report_dict,
        }, f, indent=2)

    print(f"Saved evaluation report -> {report_file}")
    print("=" * 65)


if __name__ == "__main__":
    train_and_evaluate()
