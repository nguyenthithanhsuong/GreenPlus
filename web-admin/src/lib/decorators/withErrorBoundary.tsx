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
            <div className="flex min-h-screen items-center justify-center bg-red-50">
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <h2 className="text-2xl font-bold text-red-600">
                  Co loi xay ra
                </h2>
                <p className="mb-4 mt-2 text-gray-600">
                  {this.state.error?.message}
                </p>
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Thu lai
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
