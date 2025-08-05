import { WebPartContext } from '@microsoft/sp-webpart-base';
import { BaseDataverseService, dataverseConfig, dataverseTables } from '@grnsw/shared';
import { IDataverseWeatherData } from '../models/IDataverseWeatherData';

export class WeatherDataService extends BaseDataverseService<IDataverseWeatherData> {
  protected tableName = dataverseTables.weatherData;

  constructor(context: WebPartContext) {
    super(context, dataverseConfig);
  }

  public async getLatestWeatherData(top: number = 10): Promise<IDataverseWeatherData[]> {
    return this.getAll({
      orderBy: 'createdon desc',
      top: top
    });
  }

  public async getWeatherDataByDateRange(startDate: Date, endDate: Date): Promise<IDataverseWeatherData[]> {
    return this.getAll({
      filter: `createdon ge ${startDate.toISOString()} and createdon le ${endDate.toISOString()}`,
      orderBy: 'createdon desc'
    });
  }

  public async getWeatherDataByStation(stationId: string): Promise<IDataverseWeatherData[]> {
    return this.getAll({
      filter: `cr4cc_station_id eq '${stationId}'`,
      orderBy: 'createdon desc',
      top: 100
    });
  }

  public async getCurrentWeatherByTrack(trackName: string): Promise<IDataverseWeatherData | null> {
    const results = await this.getAll({
      filter: `cr4cc_track_name eq '${trackName}' and cr4cc_is_current_reading eq true`,
      top: 1
    });

    return results.length > 0 ? results[0] : null;
  }

  public async getWeatherAverages(startDate: Date, endDate: Date, stationId?: string): Promise<any> {
    const filter = [`createdon ge ${startDate.toISOString()}`, `createdon le ${endDate.toISOString()}`];
    
    if (stationId) {
      filter.push(`cr4cc_station_id eq '${stationId}'`);
    }

    const data = await this.getAll({
      filter: filter.join(' and '),
      select: [
        'cr4cc_temp_celsius',
        'cr4cc_hum',
        'cr4cc_wind_speed_kmh',
        'cr4cc_rainfall_day_mm',
        'cr4cc_bar_sea_level'
      ]
    });

    if (data.length === 0) return null;

    // Calculate averages
    const sum = data.reduce((acc, curr) => ({
      temp: acc.temp + (curr.cr4cc_temp_celsius || 0),
      humidity: acc.humidity + (curr.cr4cc_hum || 0),
      windSpeed: acc.windSpeed + (curr.cr4cc_wind_speed_kmh || 0),
      rainfall: acc.rainfall + (curr.cr4cc_rainfall_day_mm || 0),
      pressure: acc.pressure + (curr.cr4cc_bar_sea_level || 0)
    }), { temp: 0, humidity: 0, windSpeed: 0, rainfall: 0, pressure: 0 });

    return {
      avgTemperature: (sum.temp / data.length).toFixed(1),
      avgHumidity: (sum.humidity / data.length).toFixed(1),
      avgWindSpeed: (sum.windSpeed / data.length).toFixed(1),
      totalRainfall: sum.rainfall.toFixed(1),
      avgPressure: (sum.pressure / data.length).toFixed(1),
      recordCount: data.length
    };
  }
}