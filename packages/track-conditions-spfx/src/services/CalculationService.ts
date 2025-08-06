import { IDataverseWeatherData } from '../models/IDataverseWeatherData';
import { IOptimalScore } from '../models/IOptimalScore';

export class CalculationService {
  /**
   * Calculate optimal racing conditions score (0-100)
   */
  public static calculateOptimalScore(data: IDataverseWeatherData): IOptimalScore {
    let score = 100;
    const factors = {
      temperature: 0,
      humidity: 0,
      wind: 0,
      rain: 0,
      volatility: 0,
      dataQuality: 0
    };

    // Temperature scoring (ideal: 15-20°C)
    const temp = data.cr4cc_temp_celsius || 0;
    if (temp < 5 || temp > 35) {
      factors.temperature = -30;
    } else if (temp < 10 || temp > 30) {
      factors.temperature = -20;
    } else if (temp < 15 || temp > 25) {
      factors.temperature = -10;
    }

    // Humidity scoring (ideal: 40-60%)
    const humidity = data.cr4cc_hum || 0;
    if (humidity > 85) {
      factors.humidity = -20;
    } else if (humidity > 70) {
      factors.humidity = -10;
    } else if (humidity < 20) {
      factors.humidity = -15;
    }

    // Wind scoring (ideal: < 10 km/h)
    const wind = data.cr4cc_wind_speed_kmh || 0;
    if (wind > 30) {
      factors.wind = -25;
    } else if (wind > 20) {
      factors.wind = -15;
    } else if (wind > 15) {
      factors.wind = -10;
    }

    // Rain penalty
    const recentRain = data.cr4cc_rainfall_last_60_min_mm || 0;
    if (recentRain > 0) {
      factors.rain = -Math.min(25, recentRain * 5);
    }

    // Data quality adjustment
    const qualityScore = data.cr4cc_data_quality_score || 100;
    factors.dataQuality = qualityScore < 80 ? -((100 - qualityScore) / 2) : 0;

    // Apply all factors
    score += factors.temperature + factors.humidity + factors.wind + factors.rain + factors.dataQuality;
    
    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Determine category
    let category: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) category = 'excellent';
    else if (score >= 60) category = 'good';
    else if (score >= 40) category = 'fair';
    else category = 'poor';

    return {
      trackName: data.cr4cc_track_name || 'Unknown',
      score,
      timestamp: new Date(data.createdon),
      factors,
      trend: 'stable', // Will be calculated by comparing with previous scores
      category
    };
  }

  /**
   * Calculate track recovery time after rain
   */
  public static calculateRecoveryTime(data: IDataverseWeatherData): number {
    const rainfall = data.cr4cc_rainfall_last_24_hr_mm || 0;
    const temp = data.cr4cc_temp_celsius || 20;
    const humidity = data.cr4cc_hum || 50;
    const windSpeed = data.cr4cc_wind_speed_kmh || 10;

    // Base evaporation rate (mm/hour)
    let evaporationRate = 0.5;

    // Temperature factor (higher temp = faster drying)
    evaporationRate *= (temp / 20);

    // Wind factor (more wind = faster drying)
    evaporationRate *= (1 + windSpeed / 20);

    // Humidity factor (lower humidity = faster drying)
    evaporationRate *= ((100 - humidity) / 50);

    // Calculate hours to dry
    const hoursToRecover = rainfall / evaporationRate;

    return Math.round(hoursToRecover * 10) / 10;
  }

  /**
   * Calculate weather volatility score
   */
  public static calculateVolatility(dataPoints: IDataverseWeatherData[]): number {
    if (dataPoints.length < 2) return 0;

    // Calculate standard deviations for key metrics
    const tempValues = dataPoints.map(d => d.cr4cc_temp_celsius || 0);
    const windValues = dataPoints.map(d => d.cr4cc_wind_speed_kmh || 0);
    const humidityValues = dataPoints.map(d => d.cr4cc_hum || 0);

    const tempStdDev = this.standardDeviation(tempValues);
    const windStdDev = this.standardDeviation(windValues);
    const humidityStdDev = this.standardDeviation(humidityValues);

    // Normalize and weight the volatility components
    const tempVolatility = Math.min(tempStdDev * 10, 100) * 0.3;
    const windVolatility = Math.min(windStdDev * 5, 100) * 0.4;
    const humidityVolatility = Math.min(humidityStdDev * 2, 100) * 0.3;

    return Math.round(tempVolatility + windVolatility + humidityVolatility);
  }

  /**
   * Calculate optimal score trend
   */
  public static calculateTrend(currentScore: number, previousScores: number[]): 'improving' | 'stable' | 'declining' {
    if (previousScores.length === 0) return 'stable';

    const avgPrevious = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
    const difference = currentScore - avgPrevious;

    if (difference > 5) return 'improving';
    if (difference < -5) return 'declining';
    return 'stable';
  }

  /**
   * Helper function to calculate standard deviation
   */
  private static standardDeviation(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Find similar historical days based on conditions
   */
  public static findSimilarDays(
    currentData: IDataverseWeatherData,
    historicalData: IDataverseWeatherData[],
    threshold: number = 10
  ): IDataverseWeatherData[] {
    return historicalData
      .map(historical => {
        const tempDiff = Math.abs((historical.cr4cc_temp_celsius || 0) - (currentData.cr4cc_temp_celsius || 0));
        const windDiff = Math.abs((historical.cr4cc_wind_speed_kmh || 0) - (currentData.cr4cc_wind_speed_kmh || 0));
        const humDiff = Math.abs((historical.cr4cc_hum || 0) - (currentData.cr4cc_hum || 0));
        
        const similarity = tempDiff + windDiff / 2 + humDiff / 3;
        
        return { data: historical, similarity };
      })
      .filter(item => item.similarity < threshold)
      .sort((a, b) => a.similarity - b.similarity)
      .map(item => item.data)
      .slice(0, 10);
  }
}