import { ProductStatus } from "../product.types";

/**
 * [STATE INTERFACE - Giao diện chung]
 * Định nghĩa hợp đồng hành vi cho các trạng thái của Sản phẩm.
 * Ở đây, câu hỏi cốt lõi là: "Người dùng (khách hàng) có được phép nhìn thấy sản phẩm này không?"
 */
export interface ProductState {
  canView(): boolean;
}

/**
 * [CONCRETE STATE 1 - Trạng thái: Đang hoạt động]
 * Sản phẩm đang được mở bán hoặc hiển thị bình thường. Chắc chắn là được xem.
 */
export class ActiveProductState implements ProductState {
  canView(): boolean {
    return true;
  }
}

/**
 * [CONCRETE STATE 2 - Trạng thái: Ngừng hoạt động / Bị ẩn]
 * Sản phẩm có thể đã bị khóa, ngừng kinh doanh hoặc đang ẩn tạm thời.
 * Khách hàng vãng lai không được phép xem.
 */
export class InactiveProductState implements ProductState {
  canView(): boolean {
    return false;
  }
}

/**
 * [FACTORY METHOD - Trạm trung chuyển tạo State]
 * Hàm này che giấu logic khởi tạo. Client (Service/Controller) chỉ cần ném 
 * chuỗi trạng thái vào đây, nó sẽ tự động trả về đúng class State cần thiết.
 * Giúp xóa bỏ hoàn toàn tình trạng "if/else rác" ở tầng nghiệp vụ.
 */
export function createProductState(status: ProductStatus): ProductState {
  if (status === "active") {
    return new ActiveProductState();
  }

  // Mặc định an toàn: Nếu không phải active (có thể là inactive, spam, deleted...), 
  // thì cứ trả về InactiveProductState để chặn hiển thị.
  return new InactiveProductState();
}