import * as React from 'react';
import { useState, useEffect } from 'react';
import { LoadingSpinner, LoadingOverlay } from '../components/LoadingSpinner';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { useAsyncOperation, useProgressiveLoading } from '../hooks/useLoadingState';

/**
 * Example showing different loading integration patterns
 * This file demonstrates how to integrate loading states into existing components
 * 
 * NOTE: This is for documentation/example purposes - not for production use
 */

// ============================================
// PATTERN 1: Basic Loading Overlay
// ============================================

interface IBasicDashboardProps {
  injuryService: any;
}

export const BasicDashboardWithLoading: React.FC<IBasicDashboardProps> = ({ injuryService }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const injuries = await injuryService.getInjuryData();
      setData(injuries);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <LoadingOverlay isLoading={isLoading} text="Loading injury data...">
      <div style={{ padding: '20px' }}>
        <h2>Injury Dashboard</h2>
        {data ? (
          <div>
            <p>Found {data.length} injury records</p>
            {/* Render actual data */}
          </div>
        ) : (
          <p>No data available</p>
        )}
      </div>
    </LoadingOverlay>
  );
};

// ============================================
// PATTERN 2: Skeleton Loading
// ============================================

export const DashboardWithSkeleton: React.FC<IBasicDashboardProps> = ({ injuryService }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      const injuries = await injuryService.getInjuryData();
      setData(injuries);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <DashboardSkeleton 
        type="safety"
        showHeader={true}
        showStats={true}
        showCharts={true}
        showTable={true}
      />
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
      <h2>Safety Dashboard</h2>
      {/* Actual dashboard content */}
      <div>Data loaded successfully!</div>
    </div>
  );
};

// ============================================
// PATTERN 3: useAsyncOperation Hook
// ============================================

export const DashboardWithAsyncHook: React.FC<IBasicDashboardProps> = ({ injuryService }) => {
  const { loadingState, data, execute } = useAsyncOperation({
    minLoadingTime: 500,
    showProgress: true
  });

  const loadInjuries = () => execute(
    () => injuryService.getInjuryData(),
    'Loading injury data...'
  );

  const loadStats = () => execute(
    () => injuryService.getMonthlyStats(),
    'Calculating statistics...'
  );

  useEffect(() => {
    loadInjuries();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadInjuries} disabled={loadingState.isLoading}>
          Load Injuries
        </button>
        <button onClick={loadStats} disabled={loadingState.isLoading} style={{ marginLeft: '10px' }}>
          Load Stats
        </button>
      </div>

      {loadingState.isLoading ? (
        <LoadingSpinner 
          size={48}
          showText={true}
          text={loadingState.message}
          center={true}
        />
      ) : loadingState.error ? (
        <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
          Error: {loadingState.error}
        </div>
      ) : data ? (
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Data Loaded Successfully</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#666' }}>
          Click a button to load data
        </div>
      )}
    </div>
  );
};

// ============================================
// PATTERN 4: Progressive Loading
// ============================================

export const DashboardWithProgressiveLoading: React.FC<IBasicDashboardProps> = ({ injuryService }) => {
  const { loadingState, results, currentStep, executeSteps } = useProgressiveLoading({
    stepDelay: 200,
    continueOnError: true
  });

  const loadDashboardData = () => executeSteps([
    {
      id: 'injuries',
      name: 'Loading injury records...',
      execute: () => injuryService.getInjuryData()
    },
    {
      id: 'stats',
      name: 'Calculating monthly statistics...',
      execute: () => injuryService.getMonthlyStats(),
      optional: true
    },
    {
      id: 'tracks',
      name: 'Loading track risk scores...',
      execute: () => injuryService.getTrackRiskScores()
    },
    {
      id: 'charts',
      name: 'Preparing chart data...',
      execute: () => new Promise(resolve => setTimeout(() => resolve({ charts: 'ready' }), 1000))
    }
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStepIcon = (stepId: string) => {
    const result = results.find(r => r.id === stepId);
    if (!result) {
      return stepId === currentStep ? '⏳' : '⭕';
    }
    return result.success ? '✅' : '❌';
  };

  const getStepColor = (stepId: string) => {
    const result = results.find(r => r.id === stepId);
    if (!result) {
      return stepId === currentStep ? '#0078d4' : '#999';
    }
    return result.success ? '#28a745' : '#dc3545';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Progressive Loading Dashboard</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadDashboardData} disabled={loadingState.isLoading}>
          🔄 Reload Dashboard
        </button>
      </div>

      {/* Progress Overview */}
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        padding: '16px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa'
      }}>
        <h3>Loading Progress</h3>
        
        {loadingState.isLoading && (
          <div style={{ marginBottom: '16px' }}>
            <LoadingSpinner size={24} showText={true} text={loadingState.message} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {['injuries', 'stats', 'tracks', 'charts'].map(stepId => (
            <div 
              key={stepId}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                border: stepId === currentStep ? '2px solid #0078d4' : '1px solid #e1e1e1'
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {getStepIcon(stepId)}
              </span>
              <span style={{ 
                color: getStepColor(stepId),
                fontWeight: stepId === currentStep ? 'bold' : 'normal'
              }}>
                {stepId.charAt(0).toUpperCase() + stepId.slice(1)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          Completed: {results.filter(r => r.success).length} / {results.length}
          {results.length > 0 && ` (${Math.round((results.filter(r => r.success).length / results.length) * 100)}%)`}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div>
          <h3>Results</h3>
          {results.map(result => (
            <div 
              key={result.id}
              style={{
                padding: '12px',
                margin: '8px 0',
                border: `1px solid ${result.success ? '#28a745' : '#dc3545'}`,
                borderRadius: '4px',
                backgroundColor: result.success ? '#d4edda' : '#f8d7da'
              }}
            >
              <div style={{ fontWeight: 'bold', color: result.success ? '#155724' : '#721c24' }}>
                {result.success ? '✅' : '❌'} {result.name}
              </div>
              {result.error && (
                <div style={{ fontSize: '12px', color: '#721c24', marginTop: '4px' }}>
                  Error: {result.error}
                </div>
              )}
              {result.data && (
                <div style={{ fontSize: '12px', color: '#155724', marginTop: '4px' }}>
                  Data: {typeof result.data === 'object' ? JSON.stringify(result.data).substring(0, 100) + '...' : result.data}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// PATTERN 5: Conditional Loading States
// ============================================

export const ConditionalLoadingExample: React.FC<IBasicDashboardProps> = ({ injuryService }) => {
  const [loadingStates, setLoadingStates] = useState({
    dashboard: true,
    stats: false,
    charts: false
  });
  const [data, setData] = useState({
    dashboard: null,
    stats: null,
    charts: null
  });

  const updateLoading = (key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: isLoading }));
  };

  const updateData = (key: string, newData: any) => {
    setData(prev => ({ ...prev, [key]: newData }));
  };

  const loadDashboard = async () => {
    updateLoading('dashboard', true);
    try {
      const dashboardData = await injuryService.getInjuryData();
      updateData('dashboard', dashboardData);
    } finally {
      updateLoading('dashboard', false);
    }
  };

  const loadStats = async () => {
    updateLoading('stats', true);
    try {
      const statsData = await injuryService.getMonthlyStats();
      updateData('stats', statsData);
    } finally {
      updateLoading('stats', false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Conditional Loading States</h2>
      
      {/* Dashboard Section */}
      <section style={{ marginBottom: '32px', border: '1px solid #ddd', padding: '16px', borderRadius: '4px' }}>
        <h3>Main Dashboard</h3>
        {loadingStates.dashboard ? (
          <DashboardSkeleton type="safety" showHeader={false} showStats={true} statsCount={3} />
        ) : (
          <div>Dashboard loaded with {data.dashboard?.length || 0} records</div>
        )}
      </section>

      {/* Stats Section */}
      <section style={{ marginBottom: '32px', border: '1px solid #ddd', padding: '16px', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Statistics</h3>
          <button onClick={loadStats} disabled={loadingStates.stats}>
            Load Stats
          </button>
        </div>
        
        <LoadingOverlay isLoading={loadingStates.stats} text="Loading statistics...">
          <div style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {data.stats ? (
              <div>Statistics loaded successfully!</div>
            ) : (
              <div style={{ color: '#666' }}>Click "Load Stats" to see statistics</div>
            )}
          </div>
        </LoadingOverlay>
      </section>
    </div>
  );
};