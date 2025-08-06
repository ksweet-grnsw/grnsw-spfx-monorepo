export interface IOptimalScore {
  trackName: string;
  score: number;
  timestamp: Date;
  factors: {
    temperature: number;
    humidity: number;
    wind: number;
    rain: number;
    volatility: number;
    dataQuality: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  category: 'excellent' | 'good' | 'fair' | 'poor';
}