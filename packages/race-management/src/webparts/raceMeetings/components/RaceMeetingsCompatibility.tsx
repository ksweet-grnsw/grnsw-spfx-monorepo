import * as React from 'react';
import { IRaceMeetingsProps } from './IRaceMeetingsProps';

// Feature flag to control which version to use
const USE_ENTERPRISE_UI = process.env.USE_ENTERPRISE_UI !== 'false';

// Lazy load components to prevent build failures
const RaceMeetingsOriginal = React.lazy(() => import('./RaceMeetings'));
const RaceMeetingsRefactored = React.lazy(() => import('./RaceMeetingsRefactored'));

/**
 * Compatibility wrapper that allows gradual migration between original and refactored versions
 * This prevents breaking changes during the transition period
 */
const RaceMeetingsCompatibility: React.FC<IRaceMeetingsProps> = (props) => {
  const [hasError, setHasError] = React.useState(false);
  const [useOriginal, setUseOriginal] = React.useState(!USE_ENTERPRISE_UI);

  // Error boundary to catch any runtime errors
  React.useEffect(() => {
    const errorHandler = (error: ErrorEvent): void => {
      console.error('Race Meetings Component Error:', error);
      setHasError(true);
      setUseOriginal(true); // Fallback to original on error
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  // Loading fallback
  const LoadingFallback = (): JSX.Element => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div>Loading Race Meetings...</div>
    </div>
  );

  // Error fallback with retry option
  const ErrorFallback = (): JSX.Element => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Failed to load Race Meetings</h3>
      <p>There was an error loading the component.</p>
      <button 
        onClick={() => {
          setHasError(false);
          setUseOriginal(!useOriginal); // Try the other version
        }}
        style={{
          padding: '8px 16px',
          marginTop: '10px',
          cursor: 'pointer'
        }}
      >
        Try Alternative Version
      </button>
    </div>
  );

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <React.Suspense fallback={<LoadingFallback />}>
      {useOriginal ? (
        <RaceMeetingsOriginal {...props} />
      ) : (
        <RaceMeetingsRefactored {...props} />
      )}
    </React.Suspense>
  );
};

export default RaceMeetingsCompatibility;