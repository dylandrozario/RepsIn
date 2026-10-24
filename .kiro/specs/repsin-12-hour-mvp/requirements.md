# Requirements Document

## Introduction

RepsIn is a React Native mobile application designed to reduce friction from going to the gym by helping users find optimal workout times based on their schedule and predicted equipment availability. The MVP targets a 12-hour hackathon delivery with 3 engineers, focusing on synthetic ML-based equipment occupancy forecasting, smart scheduling, and personalized workout generation. The system prioritizes local-first operation with no external services, cloud backends, or production authentication.

## Glossary

- **RepsIn_App**: The React Native mobile application
- **User**: A person using the application to plan gym workouts
- **Gym**: A fitness facility with equipment inventory and operating hours
- **Equipment_Type**: A category of gym equipment (e.g., bench press, squat rack, treadmill)
- **Equipment_Unit**: A single instance of an equipment type
- **Occupancy_Predictor**: The ML model that forecasts equipment availability
- **Synthetic_Dataset**: Artificially generated training data for the ML model (not real gym observations)
- **Occupancy_Prediction**: The probability that all units of a given equipment type are occupied at a specified time
- **Congestion_Level**: A categorization of predicted equipment availability (low, moderate, high, unknown)
- **Availability_Window**: A time interval when the user is free to work out
- **Workout_Session**: A planned or completed exercise routine
- **Workout_Time_Slot**: A specific date and time when a workout is scheduled
- **Recommendation_Engine**: The component that ranks workout time slots
- **Exercise**: A specific movement or activity (e.g., barbell squat, push-ups)
- **Workout_Template**: A predefined structure for organizing exercises (e.g., push/pull/legs, full-body)
- **Local_Storage**: On-device data persistence mechanism
- **Time_Slider**: An interactive UI component for exploring predictions across different times

## Requirements

### Requirement 1: User Onboarding

**User Story:** As a new user, I want to complete an onboarding flow to set my fitness preferences, so that the application can personalize workout recommendations.

#### Acceptance Criteria

1. THE RepsIn_App SHALL collect the User's fitness goal (muscle building, strength, endurance, general fitness, or weight management)
2. THE RepsIn_App SHALL collect the User's experience level (beginner, intermediate, or advanced)
3. THE RepsIn_App SHALL collect the User's preferred workout duration (20, 30, 45, 60, or 90 minutes)
4. THE RepsIn_App SHALL collect the User's preferred gym selection from available gyms
5. THE RepsIn_App SHALL persist all onboarding preferences to Local_Storage
6. WHEN onboarding is completed, THE RepsIn_App SHALL navigate to the home dashboard

### Requirement 2: Manual Weekly Availability Input

**User Story:** As a user, I want to specify my weekly availability, so that the system can recommend workout times that fit my schedule.

#### Acceptance Criteria

1. THE RepsIn_App SHALL allow the User to specify recurring weekly Availability_Windows with day-of-week, start time, and end time
2. THE RepsIn_App SHALL allow the User to add multiple Availability_Windows
3. THE RepsIn_App SHALL allow the User to edit existing Availability_Windows
4. THE RepsIn_App SHALL allow the User to delete Availability_Windows
5. THE RepsIn_App SHALL persist all Availability_Windows to Local_Storage
6. WHEN Availability_Windows are modified, THE RepsIn_App SHALL update recommendations using the new availability

### Requirement 3: Gym Information Display

**User Story:** As a user, I want to view gym details, so that I know the facility's location, hours, and available equipment.

#### Acceptance Criteria

1. THE RepsIn_App SHALL display the Gym's name, address, and operating hours
2. THE RepsIn_App SHALL display the complete Equipment_Type inventory with unit counts for each type
3. THE RepsIn_App SHALL load gym information from Local_Storage
4. WHEN the User selects a different Gym, THE RepsIn_App SHALL update displayed information within 100 milliseconds

### Requirement 4: Synthetic ML Training Dataset

**User Story:** As the ML engineer, I want to generate a synthetic training dataset, so that the Occupancy_Predictor can be trained within the hackathon timeline.

#### Acceptance Criteria

1. THE ML_Pipeline SHALL generate synthetic equipment usage observations with timestamp, Equipment_Type, and occupancy status
2. THE ML_Pipeline SHALL create training data that varies by weekday, hour, and Equipment_Type
3. THE ML_Pipeline SHALL produce a dataset sufficient for training an Occupancy_Predictor
4. THE ML_Pipeline SHALL export the Occupancy_Predictor in a format compatible with on-device JavaScript inference
5. THE RepsIn_App SHALL label all predictions derived from the Synthetic_Dataset as demonstration data (not real observations)

### Requirement 5: Equipment Occupancy Predictions

**User Story:** As a user, I want to see predicted equipment availability at different times, so that I can avoid crowded periods.

#### Acceptance Criteria

1. WHEN the User requests predictions for a specific time, THE Occupancy_Predictor SHALL return an Occupancy_Prediction for each Equipment_Type
2. THE Occupancy_Predictor SHALL output a probability value between 0.0 and 1.0 indicating likelihood that all Equipment_Units are occupied
3. THE Occupancy_Predictor SHALL run on-device without requiring network connectivity
4. THE RepsIn_App SHALL compute the Occupancy_Prediction within 500 milliseconds of a time selection
5. THE RepsIn_App SHALL display a visible label indicating predictions are based on synthetic demonstration data

### Requirement 6: Interactive Equipment Forecast Exploration

**User Story:** As a user, I want to explore equipment forecasts across different times of day, so that I can identify the best time to work out.

#### Acceptance Criteria

1. THE RepsIn_App SHALL provide a Time_Slider for selecting times throughout the day
2. WHEN the User adjusts the Time_Slider, THE RepsIn_App SHALL update displayed Occupancy_Predictions for all Equipment_Types within 500 milliseconds
3. THE RepsIn_App SHALL categorize each Equipment_Type's prediction into a Congestion_Level (low, moderate, high, or unknown)
4. THE RepsIn_App SHALL display historical equipment usage patterns by weekday and hour
5. THE RepsIn_App SHALL highlight the best Availability_Window with lowest predicted congestion

### Requirement 7: Smart Workout Time Recommendations

**User Story:** As a user, I want to receive ranked workout time recommendations, so that I can choose when to work out without manual schedule checking.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL identify all Workout_Time_Slots that fall within User Availability_Windows and Gym operating hours
2. THE Recommendation_Engine SHALL exclude Workout_Time_Slots that conflict with the User's existing scheduled workouts
3. THE Recommendation_Engine SHALL rank Workout_Time_Slots using predicted equipment congestion and User preferences
4. THE Recommendation_Engine SHALL present at least three ranked recommendations to the User
5. IF no valid Workout_Time_Slots exist, THEN THE RepsIn_App SHALL display an explanation indicating no available times match the constraints

### Requirement 8: Conflict Detection

**User Story:** As a user, I want the system to prevent scheduling conflicts, so that I do not accidentally double-book workout times.

#### Acceptance Criteria

1. WHEN the User attempts to schedule a Workout_Session, THE RepsIn_App SHALL verify the Workout_Time_Slot does not overlap with existing scheduled sessions
2. IF a scheduling conflict exists, THEN THE RepsIn_App SHALL display an error message and prevent the scheduling
3. THE RepsIn_App SHALL verify the Workout_Time_Slot falls within the Gym's operating hours
4. IF the Workout_Time_Slot is outside operating hours, THEN THE RepsIn_App SHALL display an error message and prevent the scheduling

### Requirement 9: Personalized Workout Generation

**User Story:** As a user, I want to receive a personalized workout routine, so that my exercise session matches my goals, experience level, and available time.

#### Acceptance Criteria

1. THE RepsIn_App SHALL generate a Workout_Session containing exercises that match the User's fitness goal and experience level
2. THE RepsIn_App SHALL ensure the total Workout_Session duration does not exceed the User's specified workout duration preference
3. THE RepsIn_App SHALL include only exercises that use Equipment_Types available at the User's selected Gym
4. THE RepsIn_App SHALL select a Workout_Template appropriate for the User's goals (push/pull/legs, upper/lower, full-body, or cardio)
5. THE RepsIn_App SHALL specify sets and reps for each Exercise

### Requirement 10: ML-Aware Exercise Selection

**User Story:** As a user, I want my workout to prioritize equipment with lower predicted congestion, so that I can complete my session efficiently without waiting.

#### Acceptance Criteria

1. WHEN generating a Workout_Session, THE RepsIn_App SHALL retrieve Occupancy_Predictions for the scheduled Workout_Time_Slot
2. THE RepsIn_App SHALL prioritize exercises using Equipment_Types with lower predicted occupancy probabilities
3. THE RepsIn_App SHALL offer exercise substitutions for Equipment_Types predicted to have high congestion
4. WHEN the User requests an alternative exercise, THE RepsIn_App SHALL provide a substitute that targets the same muscle groups using less congested equipment

### Requirement 11: Exercise Database

**User Story:** As a user, I want access to exercise instructions and details, so that I can perform movements correctly.

#### Acceptance Criteria

1. THE RepsIn_App SHALL maintain an Exercise database with movement name, targeted muscle groups, required Equipment_Type, and difficulty level
2. THE RepsIn_App SHALL display exercise instructions including form cues and technique guidance
3. THE RepsIn_App SHALL store the Exercise database in Local_Storage
4. WHEN the User views an Exercise, THE RepsIn_App SHALL retrieve and display exercise details within 200 milliseconds

### Requirement 12: Workout Scheduling

**User Story:** As a user, I want to schedule a workout at a recommended time, so that I can commit to a specific gym session.

#### Acceptance Criteria

1. THE RepsIn_App SHALL allow the User to save a Workout_Session with a specific Workout_Time_Slot
2. THE RepsIn_App SHALL persist the scheduled Workout_Session to Local_Storage
3. WHEN a Workout_Session is scheduled, THE RepsIn_App SHALL update the weekly schedule view within 500 milliseconds
4. THE RepsIn_App SHALL display scheduled Workout_Sessions on the home dashboard

### Requirement 13: Workout Completion

**User Story:** As a user, I want to mark a workout as completed, so that I can track my progress toward weekly goals.

#### Acceptance Criteria

1. THE RepsIn_App SHALL allow the User to mark a scheduled Workout_Session as completed
2. WHEN a Workout_Session is marked complete, THE RepsIn_App SHALL update the completion status in Local_Storage
3. THE RepsIn_App SHALL update the weekly progress display to reflect the completed session within 500 milliseconds
4. THE RepsIn_App SHALL distinguish between scheduled and completed Workout_Sessions in the weekly schedule view

### Requirement 14: Home Dashboard

**User Story:** As a user, I want to see a home dashboard with my next workout and progress, so that I have an overview of my fitness plan.

#### Acceptance Criteria

1. THE RepsIn_App SHALL display the next scheduled Workout_Session with time and Gym name
2. THE RepsIn_App SHALL display the next best recommended Workout_Time_Slot with predicted congestion information
3. THE RepsIn_App SHALL display weekly completion progress showing completed versus total scheduled workouts
4. THE RepsIn_App SHALL provide navigation to the equipment forecast dashboard from the home screen
5. WHEN the User opens the RepsIn_App, THE home dashboard SHALL load within 1 second

### Requirement 15: Equipment Forecast Dashboard

**User Story:** As a user, I want to view an equipment forecast dashboard, so that I can see predicted congestion across all equipment types.

#### Acceptance Criteria

1. THE RepsIn_App SHALL display Occupancy_Predictions for all Equipment_Types at the selected time
2. THE RepsIn_App SHALL visualize each Equipment_Type's Congestion_Level with color coding or indicators
3. THE RepsIn_App SHALL allow the User to select different times using the Time_Slider
4. THE RepsIn_App SHALL update the forecast display within 500 milliseconds when the time selection changes
5. THE RepsIn_App SHALL display the synthetic data disclaimer on the equipment forecast dashboard

### Requirement 16: Local Data Persistence

**User Story:** As a user, I want my preferences and schedules to persist when I close and reopen the app, so that I do not lose my data.

#### Acceptance Criteria

1. THE RepsIn_App SHALL persist User onboarding preferences to Local_Storage
2. THE RepsIn_App SHALL persist all Availability_Windows to Local_Storage
3. THE RepsIn_App SHALL persist all scheduled and completed Workout_Sessions to Local_Storage
4. THE RepsIn_App SHALL persist Gym information and Exercise database to Local_Storage
5. WHEN the RepsIn_App restarts, THE RepsIn_App SHALL restore all persisted data within 2 seconds
6. IF Local_Storage is unavailable, THEN THE RepsIn_App SHALL display an error message indicating data persistence failure

### Requirement 17: Gym Operating Hours Validation

**User Story:** As a user, I want the system to respect gym operating hours, so that I am not recommended times when the facility is closed.

#### Acceptance Criteria

1. THE RepsIn_App SHALL store operating hours for each Gym as a schedule with opening and closing times for each day of the week
2. THE Recommendation_Engine SHALL exclude Workout_Time_Slots outside the Gym's operating hours
3. WHEN displaying equipment forecasts, THE RepsIn_App SHALL indicate when the Gym is closed
4. THE RepsIn_App SHALL prevent scheduling Workout_Sessions during closed hours

### Requirement 18: Weekly Progress Tracking

**User Story:** As a user, I want to track my weekly workout completion, so that I can see how consistently I am training.

#### Acceptance Criteria

1. THE RepsIn_App SHALL calculate the number of completed Workout_Sessions in the current week
2. THE RepsIn_App SHALL calculate the total number of scheduled Workout_Sessions in the current week
3. THE RepsIn_App SHALL display the weekly completion ratio on the home dashboard
4. WHEN a Workout_Session is completed or scheduled, THE RepsIn_App SHALL update the weekly progress within 500 milliseconds

### Requirement 19: Expo Go Compatibility

**User Story:** As a hackathon participant, I want to run the app through Expo Go, so that we can demo on real devices without building native binaries.

#### Acceptance Criteria

1. THE RepsIn_App SHALL run successfully in the Expo Go mobile application
2. THE RepsIn_App SHALL use only React Native and Expo SDK APIs compatible with Expo Go
3. THE RepsIn_App SHALL function without requiring custom native modules or ejection from Expo
4. THE Occupancy_Predictor SHALL execute using JavaScript-compatible ML inference (no native ML frameworks)

### Requirement 20: No External Service Dependencies

**User Story:** As a hackathon participant, I want the app to function entirely offline, so that we avoid external service setup and API costs during the 12-hour timeline.

#### Acceptance Criteria

1. THE RepsIn_App SHALL function without network connectivity
2. THE RepsIn_App SHALL NOT require authentication services or user account systems
3. THE RepsIn_App SHALL NOT integrate with external calendar services
4. THE RepsIn_App SHALL NOT connect to cloud databases or backend APIs
5. THE RepsIn_App SHALL NOT use paid AI APIs or third-party ML services
6. THE RepsIn_App SHALL store all data using Local_Storage only

