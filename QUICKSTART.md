# 🚀 RepsIn Quickstart Guide

**Get running in 10 minutes!**

---

## For ML Engineer (You!)

### Step 1: Set up Python environment (2 min)

```bash
cd ml-pipeline
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Generate synthetic training data (1 min)

```bash
cd scripts
python generate_synthetic_data.py
```

Expected output:
```
✅ Saved 10,752 rows to ../data/synthetic_occupancy_data.csv
📊 Dataset Summary:
Total observations: 10752
Equipment types: 8
Weeks covered: 8
```

### Step 3: Train model & export predictions (1 min)

```bash
python train_model.py
```

Expected output:
```
✅ Model trained!
Accuracy: 82%
✅ Exported lookup table to ../models/occupancy_predictions.json
```

### Step 4: Test predictions (30 sec)

```bash
python test_predictions.py
```

### Step 5: Copy to mobile app (10 sec)

```bash
cp ../models/occupancy_predictions.json ../../mobile-app/src/data/
```

### ✅ You're done!

Your ML model is ready. The mobile app will use `occupancyPredictor.js` to load these predictions.

---

## Integration Points

### Data Contract

Your model outputs this JSON structure:

```json
{
  "bench_press": {
    "Monday": {
      "17": {
        "probability": 0.85,
        "congestion_level": "high"
      }
    }
  }
}
```

### How Mobile App Uses It

```javascript
// In mobile-app/src/services/occupancyPredictor.js
const prediction = predictor.predict('bench_press', 'Monday', 17);
// Returns: { probability: 0.85, congestionLevel: 'high' }
```

### Testing Integration

After copying predictions to mobile app:

```bash
cd ../../mobile-app
npm start
```

Open on device and check:
1. Equipment forecast screen loads predictions
2. Time slider updates smoothly (<500ms)
3. "Synthetic Demo Data" warning is visible

---

## Debugging

### If predictions seem wrong

1. Check your synthetic data patterns in `generate_synthetic_data.py`
2. Adjust `get_base_occupancy_probability()` function
3. Re-run: `python generate_synthetic_data.py && python train_model.py`

### If mobile app shows errors

```bash
# Check file exists
ls ../../mobile-app/src/data/occupancyPredictions.json

# Validate JSON
cat ../../mobile-app/src/data/occupancyPredictions.json | python -m json.tool
```

### If you want to tweak patterns

Edit these variables in `generate_synthetic_data.py`:
- `EQUIPMENT_TYPES` - Add/remove equipment or change popularity
- `get_base_occupancy_probability()` - Adjust time/day patterns

---

## Performance Targets

✅ Dataset generation: <10 seconds  
✅ Model training: <30 seconds  
✅ Prediction export: <5 seconds  
✅ Mobile app prediction lookup: <1ms  
✅ JSON file size: <100KB  

---

## Next Steps

1. **Validate with UI Engineer**: Confirm predictions display correctly
2. **Coordinate with Integration Engineer**: Test recommendation algorithm uses predictions
3. **Review synthetic patterns**: Make sure peak hours look realistic for demo
4. **Prepare demo talking points**: Explain ML approach in 30 seconds

---

## Demo Talking Points

> "We trained a logistic regression model on 8 weeks of synthetic gym usage data, capturing realistic patterns like evening rush hours and Monday chest day. For hackathon speed, we pre-computed all predictions as a JSON lookup table - this gives us instant on-device inference without any ML runtime overhead. The model achieves 82% accuracy and updates predictions in under 1 millisecond."

---

## 🎯 Your Deliverables Checklist

- [ ] Synthetic dataset generated (10,752+ rows)
- [ ] Model trained with 80%+ accuracy
- [ ] Predictions exported as JSON
- [ ] File copied to mobile app
- [ ] Integration tested on device
- [ ] "Synthetic Demo Data" warning visible
- [ ] Performance targets met (<500ms updates)

---

## Questions?

Check the full docs:
- [ML Pipeline README](./ml-pipeline/README.md)
- [Mobile App README](./mobile-app/README.md)
- [Feature Roadmap](./Feature_Roadmap.md)
