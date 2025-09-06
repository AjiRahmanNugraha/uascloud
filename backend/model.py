import sys
import json
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Load model & tokenizer
tokenizer = AutoTokenizer.from_pretrained("ethandavey/mental-health-diagnosis-bert")
model = AutoModelForSequenceClassification.from_pretrained("ethandavey/mental-health-diagnosis-bert")

# Label mapping
label_mapping = {0: "Anxiety", 1: "Normal", 2: "Depression", 3: "Suicidal", 4: "Stress"}

# Input dari Node.js (stdin)
data = sys.stdin.read()
text = json.loads(data)["text"]

# Tokenize
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=128)

# Predict
with torch.no_grad():
    outputs = model(**inputs)
    probabilities = F.softmax(outputs.logits, dim=1)

predicted_class = torch.argmax(probabilities, dim=1).item()
prediction = label_mapping[predicted_class]
confidence = probabilities[0][predicted_class].item()

# Kirim balik ke Node.js
print(json.dumps({
    "prediction": prediction,
    "confidence": round(confidence, 2)
}))
