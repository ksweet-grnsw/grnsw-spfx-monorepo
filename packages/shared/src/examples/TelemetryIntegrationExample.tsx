import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { TelemetryService, TelemetrySeverity } from '../services/TelemetryService';
import { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * Example showing telemetry integration patterns
 * This file demonstrates how to integrate telemetry into existing components
 * 
 * NOTE: This is for documentation/example purposes - not for production use
 */

// ============================================
// PATTERN 1: Basic Telemetry Integration
// ============================================

interface ITelemetryExampleProps {
  context: WebPartContext;
  injuryService: any;
}

export const BasicTelemetryExample: React.FC<ITelemetryExampleProps> = ({ 
  context, 
  injuryService 
}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const telemetryRef = useRef<TelemetryService>();

  useEffect(() => {
    // Initialize telemetry service
    telemetryRef.current = new TelemetryService(context, {
      enabled: true,
      logToConsole: process.env.NODE_ENV === 'development',
      instrumentationKey: 'your-app-insights-key', // Replace with actual key
      autoTrackPageViews: true,
      trackSessions: true
    });

    // Track component mount
    telemetryRef.current.trackUserAction('component_mount', 'basic_telemetry_example');

    return () => {
      // Clean up on unmount
      telemetryRef.current?.dispose();
    };
  }, [context]);

  const loadData = async () => {
    if (!telemetryRef.current) return;

    // Track user action
    telemetryRef.current.trackUserAction('click', 'load_data_button');

    // Start performance timer
    const timer = telemetryRef.current.startTimer('load_injury_data');
    
    setIsLoading(true);

    try {
      const injuries = await injuryService.getInjuryData();
      
      // Stop timer with success
      timer.stop({ 
        success: true, 
        properties: { recordCount: injuries.length.toString() },
        metrics: { recordCount: injuries.length }
      });

      // Track business metric
      telemetryRef.current.trackBusinessMetric(
        'data_load',
        'injury_records_loaded',
        injuries.length,
        'count'
      );

      setData(injuries);

    } catch (error: any) {
      // Stop timer with error
      timer.stop({ success: false });

      // Track error with context
      telemetryRef.current.trackError(
        error,
        'injury_service',
        'load_data_button_click',
        { 
          component: 'BasicTelemetryExample',
          userAction: 'data_load'
        }
      );

      console.error('Failed to load data:', error);

    } finally {
      setIsLoading(false);
    }
  };

  const handleViewChange = (viewType: string) => {
    telemetryRef.current?.trackUserAction('view_change', 'data_view', {
      newView: viewType,
      previousView: 'default'
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Basic Telemetry Integration</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadData} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load Injury Data'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => handleViewChange('table')}>Table View</button>
        <button onClick={() => handleViewChange('chart')} style={{ marginLeft: '10px' }}>
          Chart View
        </button>
      </div>

      {isLoading && <LoadingSpinner showText={true} text="Loading injury data..." />}

      {data && (
        <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Data Loaded Successfully</h3>
          <p>Records: {data.length}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// PATTERN 2: Service Integration with Telemetry
// ============================================

class InjuryServiceWithTelemetry {
  private telemetry: TelemetryService;
  private baseService: any;

  constructor(baseService: any, telemetry: TelemetryService) {
    this.baseService = baseService;
    this.telemetry = telemetry;
  }

  async getInjuries(filters?: any): Promise<any[]> {
    const timer = this.telemetry.startTimer('get_injuries');
    
    try {
      // Track API call start
      const startTime = Date.now();
      
      const result = await this.baseService.getInjuries(filters);
      const duration = Date.now() - startTime;
      
      // Track successful API call
      this.telemetry.trackApiCall(
        'get_injuries',
        'GET',
        duration,
        true,
        200,
        JSON.stringify(result).length
      );

      // Track business metrics
      this.telemetry.trackBusinessMetric(
        'data_retrieval',
        'injuries_retrieved',
        result.length,
        'count'
      );

      timer.stop({ 
        success: true,
        metrics: { 
          recordCount: result.length,
          responseSize: JSON.stringify(result).length 
        }
      });

      return result;

    } catch (error: any) {
      const duration = Date.now() - Date.now(); // This would be tracked differently in real implementation
      
      // Track failed API call
      this.telemetry.trackApiCall(
        'get_injuries',
        'GET', 
        duration,
        false,
        error.status || 500
      );

      timer.stop({ success: false });

      // Track error
      this.telemetry.trackError(
        error,
        'injury_service',
        'get_injuries',
        { filters: JSON.stringify(filters) }
      );

      throw error;
    }
  }

  async getMonthlyStats(): Promise<any> {
    const timer = this.telemetry.startTimer('get_monthly_stats');

    try {
      const result = await this.baseService.getMonthlyStats();
      
      timer.stop({ success: true });
      
      // Track that stats were generated
      this.telemetry.trackEvent({
        name: 'stats_generated',
        properties: {
          statsType: 'monthly',
          generatedAt: new Date().toISOString()
        },
        measurements: {
          statsCount: Object.keys(result).length
        },
        severity: TelemetrySeverity.Information
      });

      return result;

    } catch (error: any) {
      timer.stop({ success: false });
      
      this.telemetry.trackError(
        error,
        'injury_service',
        'get_monthly_stats'
      );

      throw error;
    }
  }
}

// ============================================
// PATTERN 3: Dashboard with Comprehensive Telemetry
// ============================================

export const DashboardWithTelemetry: React.FC<ITelemetryExampleProps> = ({ 
  context, 
  injuryService 
}) => {
  const [dashboardData, setDashboardData] = useState({
    injuries: null,
    stats: null,
    charts: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [telemetryService, setTelemetryService] = useState<TelemetryService | null>(null);
  const [enhancedService, setEnhancedService] = useState<InjuryServiceWithTelemetry | null>(null);

  useEffect(() => {
    // Initialize telemetry
    const telemetry = new TelemetryService(context, {
      enabled: true,
      logToConsole: true,
      instrumentationKey: process.env.APP_INSIGHTS_KEY,
      autoTrackPageViews: true,
      bufferSize: 25,
      sendInterval: 5000
    });

    setTelemetryService(telemetry);

    // Create enhanced service with telemetry
    const enhanced = new InjuryServiceWithTelemetry(injuryService, telemetry);
    setEnhancedService(enhanced);

    // Track dashboard load
    telemetry.trackUserAction('dashboard_load', 'safety_dashboard', {
      userId: context.pageContext.user?.email,
      timestamp: new Date().toISOString()
    });

    return () => {
      telemetry.dispose();
    };
  }, [context, injuryService]);

  const loadDashboard = async () => {
    if (!enhancedService || !telemetryService) return;

    setIsLoading(true);
    const dashboardTimer = telemetryService.startTimer('load_full_dashboard');

    try {
      // Track dashboard refresh
      telemetryService.trackUserAction('dashboard_refresh', 'safety_dashboard');

      // Load data with telemetry
      const [injuries, stats] = await Promise.all([
        enhancedService.getInjuries(),
        enhancedService.getMonthlyStats()
      ]);

      // Simulate chart generation
      const chartTimer = telemetryService.startTimer('generate_charts');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
      const charts = { generated: true, count: 3 };
      chartTimer.stop({ success: true, metrics: { chartCount: 3 } });

      setDashboardData({ injuries, stats, charts });

      dashboardTimer.stop({ 
        success: true,
        metrics: { 
          injuryCount: injuries.length,
          statsCount: Object.keys(stats).length,
          chartCount: charts.count
        }
      });

      // Track business metrics for the complete dashboard
      telemetryService.trackBusinessMetric(
        'dashboard_usage',
        'full_dashboard_loaded',
        1,
        'load',
        {
          injuryRecords: injuries.length.toString(),
          statsGenerated: Object.keys(stats).length.toString(),
          loadTime: Date.now().toString()
        }
      );

    } catch (error: any) {
      dashboardTimer.stop({ success: false });
      
      telemetryService.trackError(
        error,
        'dashboard_component',
        'load_dashboard',
        {
          component: 'DashboardWithTelemetry',
          userAction: 'full_dashboard_load'
        }
      );

    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    if (!telemetryService) return;

    telemetryService.trackUserAction('export', 'dashboard_data', {
      exportFormat: 'csv',
      recordCount: dashboardData.injuries?.length || 0
    });

    // Simulate export
    console.log('Exporting data...');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard with Comprehensive Telemetry</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadDashboard} disabled={isLoading}>
          {isLoading ? 'Loading Dashboard...' : 'Load Dashboard'}
        </button>
        
        <button 
          onClick={handleExportData} 
          disabled={!dashboardData.injuries}
          style={{ marginLeft: '10px' }}
        >
          Export Data
        </button>
      </div>

      {isLoading && (
        <LoadingSpinner showText={true} text="Loading dashboard components..." />
      )}

      {dashboardData.injuries && (
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>📊 Injury Data</h3>
            <p>Records: {dashboardData.injuries.length}</p>
          </div>

          <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>📈 Statistics</h3>
            <p>Stats: {Object.keys(dashboardData.stats || {}).length}</p>
          </div>

          <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <h3>📉 Charts</h3>
            <p>Charts: {dashboardData.charts?.count || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PATTERN 4: Error Handling with Telemetry
// ============================================

export const ErrorHandlingWithTelemetry: React.FC<ITelemetryExampleProps> = ({ 
  context, 
  injuryService 
}) => {
  const [telemetryService, setTelemetryService] = useState<TelemetryService | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const telemetry = new TelemetryService(context, { enabled: true, logToConsole: true });
    setTelemetryService(telemetry);

    return () => telemetry.dispose();
  }, [context]);

  const triggerNetworkError = async () => {
    if (!telemetryService) return;

    try {
      // This will likely fail
      const response = await fetch('https://invalid-url-that-will-fail.com/api/data');
      const data = await response.json();
      
    } catch (error: any) {
      setLastError(error.message);
      
      // Track detailed network error
      telemetryService.trackError(
        error,
        'network_service',
        'trigger_network_error',
        {
          component: 'ErrorHandlingWithTelemetry',
          errorType: 'NetworkError',
          url: 'https://invalid-url-that-will-fail.com/api/data'
        }
      );
    }
  };

  const triggerDataProcessingError = () => {
    if (!telemetryService) return;

    try {
      // Simulate data processing error
      const invalidData = null;
      const result = invalidData.someProperty.nested.value;
      
    } catch (error: any) {
      setLastError(error.message);
      
      telemetryService.trackError(
        error,
        'data_processor',
        'trigger_processing_error',
        {
          component: 'ErrorHandlingWithTelemetry',
          errorType: 'TypeError',
          operation: 'data_access'
        }
      );
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Error Handling with Telemetry</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={triggerNetworkError}>
          Trigger Network Error
        </button>
        <button onClick={triggerDataProcessingError} style={{ marginLeft: '10px' }}>
          Trigger Processing Error
        </button>
      </div>

      {lastError && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#fee', 
          border: '1px solid #f88',
          borderRadius: '4px',
          color: '#c00'
        }}>
          <strong>Last Error:</strong> {lastError}
          <br />
          <small>Check console for telemetry data</small>
        </div>
      )}
    </div>
  );
};