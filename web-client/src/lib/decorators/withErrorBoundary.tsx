import React, { ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export interface WithErrorBoundaryProps {
  onError?: (error: Error) => void;
}

type ComponentType<P = object> = React.ComponentType<P>;

export function withErrorBoundary<P extends object & WithErrorBoundaryProps>(
  Component: ComponentType<P>,
  fallback?: ReactNode,
): ComponentType<P> {
  return class ErrorBoundaryComponent extends React.Component<
    P,
    ErrorBoundaryState
  > {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
      console.error("ErrorBoundary caught:", error);
      const { onError } = this.props as WithErrorBoundaryProps;
      if (onError) {
        onError(error);
      }
    }

    handleRetry = () => {
      this.setState({ hasError: false, error: undefined });
    };

    render() {
      if (this.state.hasError) {
        return (
          fallback || (
            <div className="flex items-center justify-center min-h-screen bg-red-50">
              <div className="text-center p-8 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold text-red-600">
                  Có lỗi xảy ra
                </h2>
                <p className="text-gray-600 mt-2 mb-4">
                  {this.state.error?.message}
                </p>
                <button
                  onClick={this.handleRetry}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )
        );
      }

      return <Component {...this.props} />;
    }
  };
}
