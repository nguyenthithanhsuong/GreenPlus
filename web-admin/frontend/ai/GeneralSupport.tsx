"use client";
import LiveSupportView from "../../../packages/support-ui/LiveSupportView";
import { useAiScope } from "./use-ai-scope";
export default function GeneralSupport(){
  const {storeId,storePicker,ready,role}=useAiScope();
  return <div className="space-y-5">{storePicker}<LiveSupportView key={storeId} storeId={storeId} ready={ready} canManage={role==="manager"||role==="admin"||role==="employee"} canEscalate={role==="manager"}/></div>;
}
