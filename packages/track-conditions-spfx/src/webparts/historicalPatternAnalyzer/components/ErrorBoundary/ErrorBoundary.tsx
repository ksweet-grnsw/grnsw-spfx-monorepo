import * as React from 'react';
import { MessageBar, MessageBarType, PrimaryButton, DefaultButton, Stack, Text } from '@fluentui/react';
import styles from './ErrorBoundary.module.scss';

interface IErrorBoundaryProps {
  componentName: string;
  context?: any;
  children: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorDetails: string;
}

export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: ''
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<IErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console and any monitoring service
    console.error(`Error in ${this.props.componentName}:`, error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);

    // Format detailed error message
    let errorDetails = this.formatErrorDetails(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorDetails
    });

    // If we have Application Insights or other monitoring, log here
    if (this.props.context?.pageContext) {
      console.log('Page Context:', {
        webUrl: this.props.context.pageContext.web.absoluteUrl,
        user: this.props.context.pageContext.user.displayName,
        timestamp: new Date().toISOString()
      });
    }
  }

  private formatErrorDetails(error: Error, errorInfo: React.ErrorInfo): string {
    const details: string[] = [];
    
    // Add error message
    if (error?.message) {
      details.push(`Error: ${error.message}`);
    }
    
    // Add stack trace
    if (error?.stack) {
      const stackLines = error.stack.split('\n').slice(0, 5);
      details.push('Stack Trace:', ...stackLines.map(line => `  ${line.trim()}`));
    }
    
    // Add component stack
    if (errorInfo?.componentStack) {
      const componentLines = errorInfo.componentStack.split('\n').slice(0, 5);
      details.push('Component Stack:', ...componentLines.map(line => `  ${line.trim()}`));
    }

    // Check for specific error types
    if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
      details.push('\nPossible Causes:');
      details.push('• Network connectivity issue');
      details.push('• Dataverse API endpoint not accessible');
      details.push('• Authentication/permissions issue');
    }

    return details.join('\n');
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: ''
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): React.ReactElement<IErrorBoundaryProps> {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <MessageBar 
            messageBarType={MessageBarType.error}
            isMultiline={true}
            className={styles.errorMessage}
          >
            <Text variant="large" block>Something went wrong in {this.props.componentName}</Text>
            <Text variant="small" block className={styles.errorDescription}>
              The component encountered an unexpected error and cannot continue.
            </Text>
          </MessageBar>

          <div className={styles.errorDetails}>
            <details className={styles.technicalDetails}>
              <summary>Technical Details</summary>
              <pre className={styles.errorCode}>
                {this.state.errorDetails}
              </pre>
            </details>
          </div>

          <Stack horizontal tokens={{ childrenGap: 10 }} className={styles.actions}>
            <PrimaryButton
              text="Try Again"
              onClick={this.handleReset}
              iconProps={{ iconName: 'Refresh' }}
            />
            <DefaultButton
              text="Reload Page"
              onClick={this.handleReload}
              iconProps={{ iconName: 'ChromeRestore' }}
            />
          </Stack>

          <div className={styles.helpText}>
            <Text variant="small">
              If the problem persists, please contact your administrator with the technical details above.
            </Text>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}