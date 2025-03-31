/* eslint-disable no-console */
/* eslint-disable no-null/no-null */
import React from 'react';

class ErrorBoundary extends React.Component<
{ children: React.ReactNode },
{ hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Caught error:', error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;
    if (hasError) {
      return (
        <div className="p-[20px] bg-[#f5f5f5]">
          <p className="text-red">Error: {error?.message}</p>
          <details className="white-space-pre-wrap">
            {error?.stack}
          </details>
        </div>
      );
    }
    return children;
  }
}

export default ErrorBoundary;

