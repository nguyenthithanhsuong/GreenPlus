import React, { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

type ComponentType<P = object> = React.ComponentType<P>;

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  requiredRole?: string,
): ComponentType<P> {
  return function WithAuthComponent(props: P) {
    const { initialized, user, isAuthenticated } = useAuthStore();

    useEffect(() => {
      if (initialized && !isAuthenticated) {
        window.location.href = "/login";
      }
    }, [initialized, isAuthenticated]);

    if (!initialized || !isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      );
    }

    if (requiredRole && user?.role !== requiredRole) {
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
