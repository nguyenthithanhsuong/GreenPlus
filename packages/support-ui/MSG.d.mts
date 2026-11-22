export type SupportLocale = 'vi' | 'en';
export type SupportMessageKey = 'heading'|'intro'|'language'|'needStore'|'subject'|'subjectPlaceholder'|'create'|'empty'|'conversation'|'messages'|'pick'|'open'|'resolved'|'finish'|'escalate'|'draft'|'draftPlaceholder'|'send'|'loadingError'|'messageError'|'createError'|'sendError'|'updateError'|'networkError';
export declare function normalizeSupportLocale(value:unknown):SupportLocale;
export declare function supportMsg(locale:SupportLocale,key:SupportMessageKey):string;
export declare const SUPPORT_MESSAGES: Readonly<Record<SupportLocale,Readonly<Record<SupportMessageKey,string>>>>;
