import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './ErrorDisplay.module.scss';

export interface IErrorDisplayProps {
  error: string;
  isPermissionError?: boolean;
}

export const ErrorDisplay: React.FC<IErrorDisplayProps> = ({ error, isPermissionError }) => {
  const is403Error = error.includes('403') || error.includes('forbidden') || error.includes('Forbidden');
  const isAuthError = is403Error || error.includes('401') || error.includes('AUTHENTICATION_ERROR');

  return (
    <div className={`${styles.errorContainer} ${isAuthError ? styles.authError : ''}`}>
      <div className={styles.errorIcon}>
        <Icon iconName={isAuthError ? "Lock" : "ErrorBadge"} />
      </div>
      <div className={styles.errorContent}>
        <h3 className={styles.errorTitle}>
          {isAuthError ? 'Access Denied' : 'Error Loading Data'}
        </h3>
        {is403Error ? (
          <>
            <p className={styles.errorMessage}>
              You don&apos;t have permission to access the weather data.
            </p>
            <div className={styles.errorDetails}>
              <p><strong>To resolve this issue:</strong></p>
              <ol>
                <li>Contact your SharePoint administrator</li>
                <li>Request access to the Dataverse Weather Data API</li>
                <li>Ensure your account has the necessary permissions for:
                  <ul>
                    <li>Dataverse environment: <code>org98489e5d.crm6.dynamics.com</code></li>
                    <li>Table: <code>cr4cc_weatherdatas</code></li>
                  </ul>
                </li>
              </ol>
            </div>
          </>
        ) : (
          <p className={styles.errorMessage}>{error}</p>
        )}
        <div className={styles.errorFooter}>
          <p className={styles.errorCode}>Error: {error}</p>
        </div>
      </div>
    </div>
  );
};