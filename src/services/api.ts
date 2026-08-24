import { Note, Notebook, Tag, User, SyncStatus } from '../types';

const API_BASE = '/api';

export const api = {
  // Auth & Profile
  async getProfile(): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`);
    return res.json();
  },

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  // Notebooks
  async getNotebooks(): Promise<{ success: boolean; notebooks: Notebook[] }> {
    const res = await fetch(`${API_BASE}/notebooks`);
    return res.json();
  },

  async createNotebook(data: { name: string; description?: string; color?: string; icon?: string }): Promise<{ success: boolean; notebook: Notebook }> {
    const res = await fetch(`${API_BASE}/notebooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateNotebook(id: string, updates: Partial<Notebook>): Promise<{ success: boolean; notebook: Notebook }> {
    const res = await fetch(`${API_BASE}/notebooks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteNotebook(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notebooks/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Tags
  async getTags(): Promise<{ success: boolean; tags: Tag[] }> {
    const res = await fetch(`${API_BASE}/tags`);
    return res.json();
  },

  async createTag(data: { name: string; color?: string }): Promise<{ success: boolean; tag: Tag }> {
    const res = await fetch(`${API_BASE}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteTag(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/tags/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Notes
  async getNotes(params?: {
    notebook_id?: string;
    tag?: string;
    favorite?: boolean;
    archived?: boolean;
    deleted?: boolean;
    search?: string;
  }): Promise<{ success: boolean; notes: Note[] }> {
    const query = new URLSearchParams();
    if (params?.notebook_id) query.append('notebook_id', params.notebook_id);
    if (params?.tag) query.append('tag', params.tag);
    if (params?.favorite !== undefined) query.append('favorite', String(params.favorite));
    if (params?.archived !== undefined) query.append('archived', String(params.archived));
    if (params?.deleted !== undefined) query.append('deleted', String(params.deleted));
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/notes?${query.toString()}`);
    return res.json();
  },

  async getNote(id: string): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}`);
    return res.json();
  },

  async createNote(data: Partial<Note>): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteNote(id: string, permanent = false): Promise<{ success: boolean; note?: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async toggleFavorite(id: string, is_favorite?: boolean): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}/favorite`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite }),
    });
    return res.json();
  },

  async toggleArchive(id: string, is_archived?: boolean): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived }),
    });
    return res.json();
  },

  async restoreNote(id: string): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}/restore`, {
      method: 'PATCH',
    });
    return res.json();
  },

  async shareNote(id: string, email: string, permission: 'viewer' | 'editor'): Promise<{ success: boolean; note: Note }> {
    const res = await fetch(`${API_BASE}/notes/${id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, permission }),
    });
    return res.json();
  },

  // Trash
  async emptyTrash(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/trash/empty`, { method: 'POST' });
    return res.json();
  },

  async restoreAllTrash(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/trash/restore-all`, { method: 'POST' });
    return res.json();
  },

  // Attachments
  async addAttachment(data: {
    note_id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }): Promise<{ success: boolean; attachment: any; note: Note }> {
    const res = await fetch(`${API_BASE}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteAttachment(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/attachments/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // AI Services
  async enhanceNote(options: {
    action: string;
    content: string;
    title?: string;
    customPrompt?: string;
    language?: string;
  }): Promise<{ success: boolean; text: string; sources?: { title: string; url: string }[]; model?: string }> {
    const res = await fetch(`${API_BASE}/ai/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return res.json();
  },

  async chatAI(messages: { role: string; content: string }[], noteContext?: string): Promise<{ success: boolean; text: string }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, noteContext }),
    });
    return res.json();
  },

  async transcribeAudio(audioBase64: string, mimeType?: string): Promise<{ success: boolean; text: string; error?: string }> {
    const res = await fetch(`${API_BASE}/ai/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64, mimeType }),
    });
    return res.json();
  },

  async textToSpeech(text: string): Promise<{ success: boolean; audioUrl?: string | null; message?: string }> {
    const res = await fetch(`${API_BASE}/ai/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  // Workspace
  async getContacts(): Promise<{ success: boolean; contacts: any[] }> {
    const res = await fetch(`${API_BASE}/workspace/contacts`);
    return res.json();
  },

  async exportToDrive(note_id: string): Promise<{ success: boolean; fileUrl: string; message: string }> {
    const res = await fetch(`${API_BASE}/workspace/drive/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id }),
    });
    return res.json();
  },

  async createCalendarReminder(data: { title: string; description?: string; start_time?: string }): Promise<{ success: boolean; htmlLink: string; message: string }> {
    const res = await fetch(`${API_BASE}/workspace/calendar/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async exportToDocs(note_id: string): Promise<{ success: boolean; docUrl: string; message: string }> {
    const res = await fetch(`${API_BASE}/workspace/docs/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id }),
    });
    return res.json();
  },

  // Data Export / Import
  async exportData(): Promise<any> {
    const res = await fetch(`${API_BASE}/data/export`);
    return res.json();
  },

  async importData(data: any): Promise<{ success: boolean; message: string; counts?: any }> {
    const res = await fetch(`${API_BASE}/data/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
