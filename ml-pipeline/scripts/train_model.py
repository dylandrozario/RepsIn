"""
Train ML model to predict equipment occupancy.
IMPROVED VERSION - Using Random Forest for better accuracy.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import json
import pickle

def load_data(data_path='../data/synthetic_occupancy_data.csv'):
    """Load synthetic training data."""
    df = pd.read_csv(data_path)
    print(f"✅ Loaded {len(df)} training examples")
    return df

def prepare_features(df):
    """Prepare features for training."""
    
    # Encode equipment type
    equipment_encoder = LabelEncoder()
    df['equipment_encoded'] = equipment_encoder.fit_transform(df['equipment_type'])
    
    # Encode weekday
    weekday_encoder = LabelEncoder()
    df['weekday_encoded'] = weekday_encoder.fit_transform(df['weekday'])
    
    # Add derived features for better accuracy
    df['is_peak_hour'] = ((df['hour'] >= 17) & (df['hour'] <= 19)).astype(int)
    df['is_lunch_hour'] = ((df['hour'] >= 12) & (df['hour'] <= 14)).astype(int)
    df['is_weekend'] = df['weekday'].isin(['Saturday', 'Sunday']).astype(int)
    df['is_morning'] = (df['hour'] <= 9).astype(int)
    df['is_evening'] = (df['hour'] >= 20).astype(int)
    
    # Features: equipment, weekday, hour, units, + derived features
    X = df[['equipment_encoded', 'weekday_encoded', 'hour', 'num_units', 
            'is_peak_hour', 'is_lunch_hour', 'is_weekend', 'is_morning', 'is_evening']].values
    y = df['is_fully_occupied'].values
    
    return X, y, equipment_encoder, weekday_encoder

def train_model(X, y):
    """Train Random Forest classifier."""
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n📊 Training on {len(X_train)} examples, testing on {len(X_test)} examples")
    
    # Train Random Forest (better for non-linear patterns)
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=20,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ Model trained!")
    print(f"Accuracy: {accuracy:.2%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Available', 'Fully Occupied']))
    
    # Feature importance
    feature_names = ['equipment', 'weekday', 'hour', 'units', 'peak_hour', 'lunch', 'weekend', 'morning', 'evening']
    importances = model.feature_importances_
    print("\n🎯 Feature Importance:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:5]:
        print(f"   {name}: {imp:.3f}")
    
    return model, X_test, y_test

def export_as_lookup_table(df, equipment_encoder, weekday_encoder, model, output_path='../models/occupancy_predictions.json'):
    """Export pre-computed predictions as JSON lookup table."""
    
    predictions = {}
    
    for equipment_type in df['equipment_type'].unique():
        predictions[equipment_type] = {}
        
        equipment_encoded = equipment_encoder.transform([equipment_type])[0]
        num_units = df[df['equipment_type'] == equipment_type]['num_units'].iloc[0]
        
        for weekday in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
            predictions[equipment_type][weekday] = {}
            
            weekday_encoded = weekday_encoder.transform([weekday])[0]
            is_weekend = 1 if weekday in ['Saturday', 'Sunday'] else 0
            
            for hour in range(6, 23):
                # Create feature vector
                is_peak = 1 if 17 <= hour <= 19 else 0
                is_lunch = 1 if 12 <= hour <= 14 else 0
                is_morning = 1 if hour <= 9 else 0
                is_evening = 1 if hour >= 20 else 0
                
                features = np.array([[equipment_encoded, weekday_encoded, hour, num_units,
                                     is_peak, is_lunch, is_weekend, is_morning, is_evening]])
                
                # Get probability from model
                prob = model.predict_proba(features)[0][1]  # Probability of "Fully Occupied"
                
                # Categorize congestion level
                if prob < 0.3:
                    congestion = 'low'
                elif prob < 0.6:
                    congestion = 'moderate'
                else:
                    congestion = 'high'
                
                predictions[equipment_type][weekday][str(hour)] = {
                    'probability': round(float(prob), 3),
                    'congestion_level': congestion
                }
    
    # Save to JSON
    with open(output_path, 'w') as f:
        json.dump(predictions, f, indent=2)
    
    print(f"\n✅ Exported lookup table to {output_path}")
    print(f"   Size: {len(json.dumps(predictions)) / 1024:.1f} KB")
    return predictions

def save_model(model, equipment_encoder, weekday_encoder, output_path='../models/occupancy_model.pkl'):
    """Save trained model and encoders."""
    
    model_artifacts = {
        'model': model,
        'equipment_encoder': equipment_encoder,
        'weekday_encoder': weekday_encoder
    }
    
    with open(output_path, 'wb') as f:
        pickle.dump(model_artifacts, f)
    
    print(f"\n✅ Saved model artifacts to {output_path}")

if __name__ == '__main__':
    print("🤖 Training IMPROVED equipment occupancy predictor...\n")
    
    # Load data
    df = load_data()
    
    # Prepare features
    X, y, equipment_encoder, weekday_encoder = prepare_features(df)
    
    # Train model (Random Forest for better accuracy)
    model, X_test, y_test = train_model(X, y)
    
    # Export as lookup table
    predictions = export_as_lookup_table(df, equipment_encoder, weekday_encoder, model)
    
    # Save model
    save_model(model, equipment_encoder, weekday_encoder)
    
    print("\n✅ Training complete!")
    print("\n💡 Next steps:")
    print("   1. Copy ../models/occupancy_predictions.json to mobile-app/src/data/")
    print("   2. Import and use in your React Native app")
    print("   3. No ML runtime needed - just JSON lookups!")
