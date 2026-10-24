# RepsIn ML Pipeline

Equipment occupancy prediction system using synthetic training data.

## 🎯 Goal

Train a lightweight model that predicts gym equipment availability, optimized for on-device inference in React Native/Expo.

## 📁 Structure

```
ml-pipeline/
├── data/                           # Generated datasets
│   ├── synthetic_occupancy_data.csv    # Training data
│   └── equipment_metadata.json         # Equipment info
├── models/                         # Trained models
│   ├── occupancy_predictions.json      # Lookup table (RECOMMENDED)
│   └── occupancy_model.pkl             # Scikit-learn model (optional)
├── scripts/                        # Training scripts
│   ├── generate_synthetic_data.py      # Create training data
│   └── train_model.py                  # Train and export model
└── requirements.txt                # Python dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ml-pipeline
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Generate Synthetic Data

```bash
cd scripts
python generate_synthetic_data.py
```

This creates:
- `data/synthetic_occupancy_data.csv` - 8 weeks of hourly observations
- `data/equipment_metadata.json` - Equipment types and unit counts

### 3. Train Model

```bash
python train_model.py
```

This creates:
- `models/occupancy_predictions.json` - Pre-computed predictions as JSON lookup table
- `models/occupancy_model.pkl` - Optional scikit-learn model

### 4. Copy to Mobile App

```bash
cp ../models/occupancy_predictions.json ../../mobile-app/src/data/
```

## 📊 Model Approach

For hackathon speed, we use a **JSON lookup table** instead of runtime ML inference:

- ✅ No ML runtime needed (no TensorFlow.js, ONNX, etc.)
- ✅ Works in Expo Go without custom native modules
- ✅ Instant predictions (<1ms)
- ✅ Small file size (~50KB)
- ✅ Easy to debug and validate

## 🔬 Synthetic Data Patterns

The generator creates realistic usage patterns:

- **Peak hours**: 5-7pm weekdays (1.5x busier)
- **Lunch rush**: 12-2pm (1.2x busier)
- **Weekend mornings**: 8-11am (1.4x busier)
- **Monday chest day**: Bench press extra busy
- **Morning cardio**: Treadmills busier 6-9am
- **Equipment capacity**: More units = lower "all occupied" probability

## 📈 Model Performance

Expected metrics on synthetic data:
- Accuracy: ~80-85%
- Precision/Recall: Balanced across classes
- Inference time: <1ms (JSON lookup)

## 🎓 Next Steps for Production

1. **Replace synthetic data** with real gym check-in logs or sensor data
2. **Add temporal features** (holidays, weather, events)
3. **Retrain periodically** as usage patterns change
4. **A/B test** predictions vs. actual wait times
5. **Collect feedback** from users on prediction accuracy

## ⚠️ Important Notes

- All predictions are labeled as **synthetic demonstration data**
- NOT real-time gym occupancy
- NOT validated against actual gym traffic
- For MVP demo purposes only
