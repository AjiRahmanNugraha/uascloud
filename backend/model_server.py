# backend/model_server.py
from flask import Flask, request, jsonify
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os

app = Flask(__name__)

MODEL_NAME = os.environ.get("HF_MODEL", "ethandavey/mental-health-diagnosis-bert")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Loading tokenizer and model:", MODEL_NAME, "-> device:", DEVICE)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.to(DEVICE)
model.eval()
print("Model loaded")

label_mapping = {0: "Anxiety", 1: "Normal", 2: "Depression", 3: "Suicidal", 4: "Stress"}

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "text required"}), 400

    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)
    # move inputs to device
    for k, v in inputs.items():
        inputs[k] = v.to(DEVICE)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=1)
    pred_idx = int(torch.argmax(probs, dim=1).item())
    confidence = float(probs[0][pred_idx].item())
    return jsonify({
        "prediction": label_mapping.get(pred_idx, "Unknown"),
        "confidence": round(confidence, 4)
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PY_PORT", 5001)))
