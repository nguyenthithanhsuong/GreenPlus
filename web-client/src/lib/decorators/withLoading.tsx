import React from "react";

export interface WithLoadingProps {
  isLoading?: boolean;
  loadingMessage?: string;
}

type ComponentType<P = object> = React.ComponentType<P>;

export function withLoading<P extends object & WithLoadingProps>(
  Component: ComponentType<P>,
): ComponentType<P> {
  return function WithLoadingComponent(props: P) {
    const { isLoading = false, loadingMessage = "Đang tải..." } = props;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">{loadingMessage}</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
