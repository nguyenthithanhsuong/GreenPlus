/** Shared user-facing Live Support message catalog. No credentials or user data. */
export const SUPPORT_MESSAGES=Object.freeze({
  vi:Object.freeze({
    heading:'Nhắn trực tiếp với nhân viên',intro:'Trao đổi với nhân viên cửa hàng, không cần có đơn hàng. Chỉ gửi thông tin cần thiết.',
    language:'Ngôn ngữ',needStore:'Vui lòng chọn cửa hàng trước khi liên hệ.',subject:'Chủ đề cần hỗ trợ',subjectPlaceholder:'Ví dụ: Tư vấn sản phẩm',
    create:'Mở hội thoại',empty:'Chưa có hội thoại.',conversation:'Hội thoại của bạn',messages:'Tin nhắn hỗ trợ',pick:'Chọn một hội thoại để đọc và gửi tin.',
    open:'Đang hỗ trợ',resolved:'Đã kết thúc',finish:'Kết thúc hỗ trợ',escalate:'Chuyển lên Admin',draft:'Nhập tin nhắn',draftPlaceholder:'Nhắn cho nhân viên',send:'Gửi',
    loadingError:'Lỗi tải hội thoại',messageError:'Lỗi tải tin nhắn',createError:'Không thể mở hội thoại',sendError:'Không thể gửi tin nhắn',updateError:'Không cập nhật được hội thoại',networkError:'Không kết nối được bộ phận hỗ trợ',
  }),
  en:Object.freeze({
    heading:'Chat with store support',intro:'Speak with store staff without an order. Share only the information needed to resolve your request.',
    language:'Language',needStore:'Select a store before contacting support.',subject:'Support topic',subjectPlaceholder:'Example: Product advice',
    create:'Start conversation',empty:'No conversations yet.',conversation:'Your conversations',messages:'Support messages',pick:'Select a conversation to read or send messages.',
    open:'Open',resolved:'Closed',finish:'Close conversation',escalate:'Escalate to administrator',draft:'Message',draftPlaceholder:'Write a message',send:'Send',
    loadingError:'Could not load conversations',messageError:'Could not load messages',createError:'Could not start conversation',sendError:'Could not send message',updateError:'Could not update conversation',networkError:'Could not reach store support',
  }),
});
export function normalizeSupportLocale(value){return value==='en'?'en':'vi';}
export function supportMsg(locale,key){return (SUPPORT_MESSAGES[normalizeSupportLocale(locale)][key]||SUPPORT_MESSAGES.vi[key]||key);}
