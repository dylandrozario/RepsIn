"""
Train ML model to predict equipment occupancy.

For hackathon speed, we use a simple approach:
- Logistic regression with scikit-learn
- Export predictions as JSON lookup table
- Fast on-device inference without ML runtime
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
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
    
    # Features: equipment type, weekday, hour, num_units
    X = df[['equipment_encoded', 'weekday_encoded', 'hour', 'num_units']].values
    y = df['is_fully_occupied'].values
    
    return X, y, equipment_encoder, weekday_encoder

def train_model(X, y):
    """Train logistic regression model."""
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n📊 Training on {len(X_train)} examples, testing on {len(X_test)} examples")
    
    # Train model
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ Model trained!")
    print(f"Accuracy: {accuracy:.2%}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Available', 'Fully Occupied']))
    
    return model, X_test, y_test

def export_as_lookup_table(df, equipment_encoder, weekday_encoder, output_path='../models/occupancy_predictions.json'):
    """
    Export pre-computed predictions as JSON lookup table.
    This is the FASTEST approach for hackathon - no ML runtime needed!
    """
    
    # Generate predictions for all combinations
    predictions = {}
    
    for equipment_type in df['equipment_type'].unique():
        predictions[equipment_type] = {}
        
        equipment_encoded = equipment_encoder.transform([equipment_type])[0]
        num_units = df[df['equipment_type'] == equipment_type]['num_units'].iloc[0]
        
        for weekday in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
            predictions[equipment_type][weekday] = {}
            
            weekday_encoded = weekday_encoder.transform([weekday])[0]
            
            for hour in range(6, 23):  # 6am to 11pm
                # Calculate probability using the synthetic data mean
                matching_rows = df[
                    (df['equipment_type'] == equipment_type) &
                    (df['weekday'] == weekday) &
                    (df['hour'] == hour)
                ]
                
                if len(matching_rows) > 0:
                    prob = matching_rows['occupancy_probability'].mean()
                else:
                    prob = 0.5  # Default
                
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
    """Save trained model and encoders (optional - for reference)."""
    
    model_artifacts = {
        'model': model,
        'equipment_encoder': equipment_encoder,
        'weekday_encoder': weekday_encoder
    }
    
    with open(output_path, 'wb') as f:
        pickle.dump(model_artifacts, f)
    
    print(f"\n✅ Saved model artifacts to {output_path}")

if __name__ == '__main__':
    print("🤖 Training equipment occupancy predictor...\n")
    
    # Load data
    df = load_data()
    
    # Prepare features
    X, y, equipment_encoder, weekday_encoder = prepare_features(df)
    
    # Train model
    model, X_test, y_test = train_model(X, y)
    
    # Export as lookup table (RECOMMENDED for hackathon)
    predictions = export_as_lookup_table(df, equipment_encoder, weekday_encoder)
    
    # Save model (optional)
    save_model(model, equipment_encoder, weekday_encoder)
    
    print("\n✅ Training complete!")
    print("\n💡 Next steps:")
    print("   1. Copy ../models/occupancy_predictions.json to mobile-app/src/data/")
    print("   2. Import and use in your React Native app")
    print("   3. No ML runtime needed - just JSON lookups!")
