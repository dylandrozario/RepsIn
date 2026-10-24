/**
 * Equipment Occupancy Predictor Service
 * 
 * Loads pre-computed ML predictions and provides fast lookups.
 * No ML runtime required - just JSON data!
 */

// This will be populated from occupancy_predictions.json after ML training
import occupancyData from '../data/occupancyPredictions.json';

class OccupancyPredictor {
  constructor() {
    this.predictions = occupancyData;
  }

  /**
   * Predict equipment occupancy for a specific time
   * @param {string} equipmentType - Equipment type (e.g., 'bench_press')
   * @param {string} weekday - Day of week (e.g., 'Monday')
   * @param {number} hour - Hour of day (6-22)
   * @returns {Object} { probability, congestionLevel }
   */
  predict(equipmentType, weekday, hour) {
    try {
      const prediction = this.predictions[equipmentType]?.[weekday]?.[hour.toString()];
      
      if (!prediction) {
        return {
          probability: 0.5,
          congestionLevel: 'unknown'
        };
      }
      
      return {
        probability: prediction.probability,
        congestionLevel: prediction.congestion_level
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return {
        probability: 0.5,
        congestionLevel: 'unknown'
      };
    }
  }

  /**
   * Get predictions for all equipment at a specific time
   * @param {string} weekday - Day of week
   * @param {number} hour - Hour of day
   * @returns {Array} Array of equipment predictions
   */
  predictAll(weekday, hour) {
    const results = [];
    
    for (const equipmentType in this.predictions) {
      const prediction = this.predict(equipmentType, weekday, hour);
      results.push({
        equipmentType,
        equipmentName: equipmentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ...prediction
      });
    }
    
    // Sort by congestion level (high to low)
    const congestionOrder = { high: 3, moderate: 2, low: 1, unknown: 0 };
    results.sort((a, b) => congestionOrder[b.congestionLevel] - congestionOrder[a.congestionLevel]);
    
    return results;
  }

  /**
   * Find the best time window with lowest congestion
   * @param {string} weekday - Day of week
   * @param {number} startHour - Start of search window
   * @param {number} endHour - End of search window
   * @returns {Object} Best time with average congestion
   */
  findBestTime(weekday, startHour = 6, endHour = 22) {
    let bestHour = startHour;
    let lowestAvgCongestion = 1.0;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const predictions = this.predictAll(weekday, hour);
      const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length;
      
      if (avgProbability < lowestAvgCongestion) {
        lowestAvgCongestion = avgProbability;
        bestHour = hour;
      }
    }
    
    return {
      hour: bestHour,
      avgCongestion: lowestAvgCongestion,
      congestionLevel: lowestAvgCongestion < 0.3 ? 'low' : lowestAvgCongestion < 0.6 ? 'moderate' : 'high'
    };
  }
}

// Singleton instance
export default new OccupancyPredictor();
