import React, { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

type ComponentType<P = object> = React.ComponentType<P>;

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  requiredRole?: string,
): ComponentType<P> {
  return function WithAuthComponent(props: P) {
    const { user, isAuthenticated } = useAuthStore();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      if (!isAuthenticated) {
        window.location.href = "/login";
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    }, [isAuthenticated, user]);

    if (!isAuthorized) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Truy cập bị từ chối
            </h2>
            <p className="text-gray-600 mt-2">
              Bạn không có quyền truy cập trang này.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
