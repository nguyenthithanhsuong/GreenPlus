import { BatchStatus } from "../product.types";

/**
 * [STATE INTERFACE - Giao diện Trạng thái]
 * Giao diện chung định nghĩa hành vi mà mọi trạng thái của lô hàng (Batch) phải có.
 * Ở đây, hành vi cốt lõi (và duy nhất) là kiểm tra xem lô hàng có bán được không: isSellable()
 */
export interface BatchState {
  isSellable(quantityAvailable: number, expireDate: string): boolean;
}

/**
 * [CONCRETE STATE 1 - Trạng thái: Có sẵn]
 * Chứa logic nghiệp vụ riêng cho trạng thái "available".
 * Ngay cả khi trạng thái trong DB là "available", lô hàng vẫn có thể KHÔNG bán được 
 * nếu thời gian hiện tại đã vượt quá hạn sử dụng (expireDate), hoặc tồn kho đã về 0.
 */
class AvailableBatchState implements BatchState {
  isSellable(quantityAvailable: number, expireDate: string): boolean {
    const isExpired = new Date(expireDate).getTime() < Date.now();
    return !isExpired && quantityAvailable > 0;
  }
}

/**
 * [CONCRETE STATE 2 - Trạng thái: Đã hết hạn]
 * Logic rất đơn giản và an toàn: Đã mang cờ "expired" thì chắc chắn không được bán, 
 * không cần quan tâm tồn kho còn hay không hay ngày tháng ra sao.
 */
class ExpiredBatchState implements BatchState {
  isSellable(): boolean {
    return false;
  }
}

/**
 * [CONCRETE STATE 3 - Trạng thái: Đã bán hết]
 * Tương tự, lô hàng đã "sold_out" thì luôn trả về false.
 */
class SoldOutBatchState implements BatchState {
  isSellable(): boolean {
    return false;
  }
}

/**
 * [FACTORY METHOD / CONTEXT ADAPTER]
 * Hàm này đóng vai trò như một "trạm trung chuyển". 
 * Nó nhận vào trạng thái (dạng chuỗi string/enum) từ Database và khởi tạo trả về 
 * đúng đối tượng State tương ứng.
 */
export function createBatchState(status: BatchStatus): BatchState {
  switch (status) {
    case "available":
      return new AvailableBatchState();
    case "expired":
      return new ExpiredBatchState();
    case "sold_out":
      return new SoldOutBatchState();
    default:
      // Fallback (mặc định) về trạng thái an toàn nhất. 
      // Nếu DB lỡ sinh ra một trạng thái lạ chưa từng có (ví dụ: "pending_review"), 
      // hệ thống sẽ auto chặn bán để không gây thiệt hại kinh doanh.
      return new SoldOutBatchState(); 
  }
}