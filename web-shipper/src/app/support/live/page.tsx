import LiveSupportView from "../../../../../packages/support-ui/LiveSupportView";
import ShipperShell from "../../../frontend/shared/ShipperShell";
import { requireShipperPage } from "../../../server/require-page-session";
export const dynamic="force-dynamic";
export default async function ShipperLiveSupport(){
  await requireShipperPage();
  return <ShipperShell title="Nhắn nhân viên hỗ trợ" description="Hội thoại ngoài đơn hàng" icon="message"><LiveSupportView title="Hỗ trợ giao vận"/></ShipperShell>;
}
