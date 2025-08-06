export interface IPrediction {
  type: 'optimal_window' | 'condition_forecast' | 'recovery_time' | 'delay_likelihood';
  trackName: string;
  timestamp: Date;
  prediction: {
    value: number | string;
    unit: string;
    confidence: number;
  };
  basedOn: string;
}