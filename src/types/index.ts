export type Language = 'ta' | 'en';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  created_at: string;
  language: Language;
  theme: ThemeMode;
  autoSaveInterval: number; // in seconds
  fontSize: 'small' | 'medium' | 'large';
}

export interface Notebook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  note_count?: number;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
  note_count?: number;
}

export interface Attachment {
  id: string;
  note_id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface SharedUser {
  id: string;
  email: string;
  name?: string;
  permission: 'viewer' | 'editor';
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  notebook_id: string;
  title: string;
  content: string; // HTML rich content
  content_text: string; // plain text for fast search
  checklist: ChecklistItem[];
  tags: string[];
  attachments: Attachment[];
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  color?: string;
  pinned?: boolean;
  reminder_date?: string;
  shared_with: SharedUser[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'syncing' | 'error';

export type NavView =
  | 'dashboard'
  | 'all'
  | 'notebook'
  | 'tag'
  | 'favorites'
  | 'recent'
  | 'archive'
  | 'trash'
  | 'shared'
  | 'calendar'
  | 'drive'
  | 'ai_chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  sources?: { title: string; url: string }[];
  timestamp: string;
}

export interface ContactItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
