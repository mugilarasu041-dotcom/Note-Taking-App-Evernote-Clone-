import { Router, Request, Response } from 'express';
import {
  enhanceNoteContent,
  chatWithGemini,
  transcribeAudio,
  convertTextToSpeech,
} from './gemini';
import { Note, Notebook, Tag, User } from '../src/types';

export const apiRouter = Router();

// In-memory data store with realistic initial Tamil & English seed data
let currentUser: User = {
  id: 'user_1',
  name: 'முகிலரசு (Mugilarasu)',
  email: 'mugilarasu041@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'முதன்மை பயனர் (Admin)',
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  language: 'ta',
  theme: 'light',
  autoSaveInterval: 2,
  fontSize: 'medium',
};

let notebooks: Notebook[] = [
  {
    id: 'nb_personal',
    user_id: 'user_1',
    name: 'தனிப்பட்டவை (Personal)',
    description: 'தனிப்பட்ட சிந்தனைகள், நாட்குறிப்பு மற்றும் இலக்குகள்',
    color: '#10b981',
    icon: 'folder',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'nb_work',
    user_id: 'user_1',
    name: 'வேலை & திட்டங்கள் (Work)',
    description: 'அலுவலக பணிகள், திட்ட ஆவணங்கள் மற்றும் கூட்டங்கள்',
    color: '#0284c7',
    icon: 'work',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'nb_ideas',
    user_id: 'user_1',
    name: 'யோசனைகள் & கற்றல் (Ideas)',
    description: 'புதிய தொழில்நுட்ப சிந்தனைகள் மற்றும் புத்தக குறிப்புகள்',
    color: '#8b5cf6',
    icon: 'lightbulb',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'nb_college',
    user_id: 'user_1',
    name: 'கல்லூரி & கல்வி (College)',
    description: 'பாடக் குறிப்புகள் மற்றும் விரிவுரை பதிவுகள்',
    color: '#f59e0b',
    icon: 'school',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

let tags: Tag[] = [
  { id: 'tag_1', user_id: 'user_1', name: 'முக்கியம்', color: '#ef4444', created_at: new Date().toISOString() },
  { id: 'tag_2', user_id: 'user_1', name: 'வேலை', color: '#3b82f6', created_at: new Date().toISOString() },
  { id: 'tag_3', user_id: 'user_1', name: 'திட்டம்', color: '#10b981', created_at: new Date().toISOString() },
  { id: 'tag_4', user_id: 'user_1', name: 'சிந்தனை', color: '#8b5cf6', created_at: new Date().toISOString() },
  { id: 'tag_5', user_id: 'user_1', name: 'சந்திப்பு', color: '#f59e0b', created_at: new Date().toISOString() },
  { id: 'tag_6', user_id: 'user_1', name: '2026', color: '#06b6d4', created_at: new Date().toISOString() },
];

let notes: Note[] = [
  {
    id: 'note_1',
    user_id: 'user_1',
    notebook_id: 'nb_work',
    title: 'வாராந்திர திட்டமிடல் & உற்பத்தித்திறன் உத்திகள்',
    content: `<h2>வாராந்திர முக்கிய இலக்குகள்</h2>
<p>இந்த வாரத்திற்கான முக்கிய பணிகள் மற்றும் திட்டங்களை ஒழுங்கமைத்தல். திங்கட்கிழமை காலை குழு சந்திப்பில் விவாதிக்கப்பட வேண்டிய குறிப்புகள்:</p>
<ul>
  <li><strong>புதிய தயாரிப்பு வடிவமைப்பு:</strong> பயனர் கருத்துக்களை சேகரித்து UI/UX மாதிரியை மேம்படுத்துதல்.</li>
  <li><strong>AI இன்டக்ரேஷன்:</strong> ஜெமினி 3.5 ஃப்ளாஷ் மூலம் குரல் வழி தட்டச்சு மற்றும் சுருக்கக் கருவிகளை ஒருங்கிணைத்தல்.</li>
  <li><strong>கிளவுட் ஒத்திசைவு:</strong> ஆஃப்லைன் பயன்முறையில் சேமிக்கப்பட்டு நெட்வொர்க் வரும் போது தானாக ஒத்திசைக்கும் தொழில்நுட்பத்தை சோதித்தல்.</li>
</ul>
<blockquote>"முறையான திட்டமிடல் கடின உழைப்பை பாதியாக குறைக்கும்."</blockquote>
<h3>அடுத்த கட்ட மைல்கற்கள்:</h3>
<p>அனைத்து சோதனைகளும் முடிந்து வெள்ளிக்கிழமைக்குள் நேரலை வெளியீடு செய்ய வேண்டும்.</p>`,
    content_text: 'வாராந்திர முக்கிய இலக்குகள் இந்த வாரத்திற்கான முக்கிய பணிகள் மற்றும் திட்டங்களை ஒழுங்கமைத்தல். திங்கட்கிழமை காலை குழு சந்திப்பில் விவாதிக்கப்பட வேண்டிய குறிப்புகள்: புதிய தயாரிப்பு வடிவமைப்பு பயனர் கருத்துக்களை சேகரித்து UI/UX மாதிரியை மேம்படுத்துதல். AI இன்டக்ரேஷன் ஜெமினி 3.5 ஃப்ளாஷ் மூலம் குரல் வழி தட்டச்சு மற்றும் சுருக்கக் கருவிகளை ஒருங்கிணைத்தல்.',
    checklist: [
      { id: 'c1', text: 'வடிவமைப்பு ஒப்புதல் பெறுதல்', checked: true },
      { id: 'c2', text: 'ஜெமினி AI API சோதித்தல்', checked: true },
      { id: 'c3', text: 'கூகிள் காலண்டரில் பணிகளை அட்டவணைப்படுத்துதல்', checked: false },
      { id: 'c4', text: 'அணிக்கான விரிவான விளக்க ஆவணத்தை அனுப்புதல்', checked: false },
    ],
    tags: ['முக்கியம்', 'வேலை', 'திட்டம்'],
    attachments: [
      {
        id: 'att_1',
        note_id: 'note_1',
        name: 'weekly_roadmap_2026.png',
        url: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=600&auto=format&fit=crop&q=80',
        type: 'image/jpeg',
        size: 345000,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    is_favorite: true,
    is_archived: false,
    is_deleted: false,
    pinned: true,
    color: '#ffffff',
    shared_with: [],
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'note_2',
    user_id: 'user_1',
    notebook_id: 'nb_ideas',
    title: 'தயாரிப்பு வெளியீடு யோசனைகள் & வளர்ச்சி யுக்திகள்',
    content: `<h2>புதிய தயாரிப்பு வெளியீட்டு யுக்திகள் (Launch Strategy)</h2>
<p>பசுமை குறிப்புகள் செயலியை உலகளவில் உள்ள தமிழ் மற்றும் ஆங்கில பயனர்களிடம் கொண்டு சேர்ப்பதற்கான உத்திகள்:</p>
<ol>
  <li><strong>நேரடி டெமோ வீடியோக்கள்:</strong> குரல் வழி தட்டச்சு மற்றும் உடனடி சுருக்கம் அம்சங்களை விளக்கும் குறும்படங்கள்.</li>
  <li><strong>பயனர் மதிப்புரைகள்:</strong> ஆரம்பகட்ட பயனர்களிடமிருந்து ஆலோசனைகளை பெற்று செயலியை மேலும் மெருகேற்றுதல்.</li>
  <li><strong>கூகிள் ஒர்க்ஸ்பேஸ் இணைப்பு:</strong> கூகிள் டிரைவ் மற்றும் டாக்ஸ் ஏற்றுமதி அம்சத்தை முதன்மைப்படுத்துதல்.</li>
</ol>
<p><em>முக்கிய குறிக்கோள்: எளிய இடைமுகம் மற்றும் மிக வேகமான செயல்பாடு.</em></p>`,
    content_text: 'புதிய தயாரிப்பு வெளியீட்டு யுக்திகள் பசுமை குறிப்புகள் செயலியை உலகளவில் உள்ள தமிழ் மற்றும் ஆங்கில பயனர்களிடம் கொண்டு சேர்ப்பதற்கான உத்திகள்',
    checklist: [
      { id: 'c5', text: 'டெமோ வீடியோ பதிவு செய்தல்', checked: false },
      { id: 'c6', text: 'சமூக ஊடக பதிவுகள் தயாரித்தல்', checked: true },
    ],
    tags: ['சிந்தனை', 'திட்டம்'],
    attachments: [],
    is_favorite: false,
    is_archived: false,
    is_deleted: false,
    pinned: false,
    color: '#ffffff',
    shared_with: [],
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'note_3',
    user_id: 'user_1',
    notebook_id: 'nb_personal',
    title: 'புத்தக சுருக்கம்: அணு பழக்கவழக்கங்கள் (Atomic Habits)',
    content: `<h2>ஜேம்ஸ் க்ளியரின் "Atomic Habits" முக்கிய கருத்துக்கள்</h2>
<p>ஒவ்வொரு நாளும் 1% முன்னேற்றம் அடைந்தால் ஓராண்டில் 37 மடங்கு சிறந்த நிலையை அடையலாம்.</p>
<h3>4 தங்க விதிகள்:</h3>
<ul>
  <li>1. எளிதில் கண்ணில் படும்படி வைக்கவும் (Make it obvious)</li>
  <li>2. கவர்ச்சிகரமானதாக மாற்றவும் (Make it attractive)</li>
  <li>3. சுலபமானதாக ஆக்கவும் (Make it easy)</li>
  <li>4. மனநிறைவை தருவதாக மாற்றவும் (Make it satisfying)</li>
</ul>`,
    content_text: 'ஜேம்ஸ் க்ளியரின் Atomic Habits முக்கிய கருத்துக்கள் ஒவ்வொரு நாளும் 1% முன்னேற்றம் அடைந்தால் ஓராண்டில் 37 மடங்கு சிறந்த நிலையை அடையலாம்.',
    checklist: [],
    tags: ['சிந்தனை', '2026'],
    attachments: [],
    is_favorite: true,
    is_archived: false,
    is_deleted: false,
    pinned: false,
    color: '#ffffff',
    shared_with: [],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'note_4',
    user_id: 'user_1',
    notebook_id: 'nb_work',
    title: 'வாடிக்கையாளர் சந்திப்பு குறிப்புகள் & முடிவுகள்',
    content: `<h2>வாடிக்கையாளர் ஆலோசனை கூட்டம்</h2>
<p><strong>தேதி:</strong> நேற்று மாலை 4:00 மணி</p>
<p><strong>பங்கேற்பாளர்கள்:</strong> வடிவமைப்பு குழு & தொழில்நுட்ப வல்லுநர்கள்</p>
<h3>முக்கிய முடிவுகள்:</h3>
<ul>
  <li>இருண்ட பயன்முறை (Dark Mode) மிக நேர்த்தியாக அமைக்கப்பட்டுள்ளது என பாராட்டு தெரிவிக்கப்பட்டது.</li>
  <li>ஆடியோ குறிப்புகளை டெக்ஸ்டாக மாற்றும் வேகம் மிகச் சிறப்பாக உள்ளது.</li>
  <li>PDF மற்றும் JSON வடிவத்தில் முழு ஏற்றுமதி வசதியை சேர்க்க கோரப்பட்டுள்ளது.</li>
</ul>`,
    content_text: 'வாடிக்கையாளர் ஆலோசனை கூட்டம் தேதி: நேற்று மாலை 4:00 மணி பங்கேற்பாளர்கள்: வடிவமைப்பு குழு & தொழில்நுட்ப வல்லுநர்கள் முக்கிய முடிவுகள்',
    checklist: [
      { id: 'c7', text: 'வாடிக்கையாளருக்கு நன்றி மின்னஞ்சல் அனுப்புதல்', checked: true },
      { id: 'c8', text: 'PDF ஏற்றுமதி சோதித்தல்', checked: true },
    ],
    tags: ['வேலை', 'சந்திப்பு'],
    attachments: [],
    is_favorite: false,
    is_archived: false,
    is_deleted: false,
    pinned: false,
    color: '#ffffff',
    shared_with: [],
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// Helper to compute notebook counts
function getEnrichedNotebooks() {
  return notebooks.map(nb => ({
    ...nb,
    note_count: notes.filter(n => n.notebook_id === nb.id && !n.is_deleted && !n.is_archived).length,
  }));
}

// Helper to compute tag counts
function getEnrichedTags() {
  return tags.map(t => ({
    ...t,
    note_count: notes.filter(n => n.tags.includes(t.name) && !n.is_deleted && !n.is_archived).length,
  }));
}

// ---------------- USER & AUTH ----------------
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  res.json({ success: true, user: currentUser });
});

apiRouter.post('/auth/profile', (req: Request, res: Response) => {
  const { name, email, avatar, language, theme, autoSaveInterval, fontSize } = req.body;
  currentUser = {
    ...currentUser,
    name: name ?? currentUser.name,
    email: email ?? currentUser.email,
    avatar: avatar ?? currentUser.avatar,
    language: language ?? currentUser.language,
    theme: theme ?? currentUser.theme,
    autoSaveInterval: autoSaveInterval ?? currentUser.autoSaveInterval,
    fontSize: fontSize ?? currentUser.fontSize,
  };
  res.json({ success: true, user: currentUser });
});

// ---------------- NOTEBOOKS ----------------
apiRouter.get('/notebooks', (req: Request, res: Response) => {
  res.json({ success: true, notebooks: getEnrichedNotebooks() });
});

apiRouter.post('/notebooks', (req: Request, res: Response) => {
  const { name, description, color, icon } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Notebook name is required' });
  }
  const newNotebook: Notebook = {
    id: `nb_${Date.now()}`,
    user_id: currentUser.id,
    name,
    description: description || '',
    color: color || '#10b981',
    icon: icon || 'folder',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  notebooks.unshift(newNotebook);
  res.status(201).json({ success: true, notebook: newNotebook });
});

apiRouter.put('/notebooks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, color, icon } = req.body;
  const index = notebooks.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Notebook not found' });
  }
  notebooks[index] = {
    ...notebooks[index],
    name: name ?? notebooks[index].name,
    description: description ?? notebooks[index].description,
    color: color ?? notebooks[index].color,
    icon: icon ?? notebooks[index].icon,
    updated_at: new Date().toISOString(),
  };
  res.json({ success: true, notebook: notebooks[index] });
});

apiRouter.delete('/notebooks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  notebooks = notebooks.filter(n => n.id !== id);
  // Reassign notes to empty notebook
  notes = notes.map(n => (n.notebook_id === id ? { ...n, notebook_id: '' } : n));
  res.json({ success: true, message: 'Notebook deleted' });
});

// ---------------- TAGS ----------------
apiRouter.get('/tags', (req: Request, res: Response) => {
  res.json({ success: true, tags: getEnrichedTags() });
});

apiRouter.post('/tags', (req: Request, res: Response) => {
  const { name, color } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Tag name is required' });
  }
  const cleanName = name.trim().replace(/^#/, '');
  const existing = tags.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return res.json({ success: true, tag: existing });
  }
  const newTag: Tag = {
    id: `tag_${Date.now()}`,
    user_id: currentUser.id,
    name: cleanName,
    color: color || '#10b981',
    created_at: new Date().toISOString(),
  };
  tags.push(newTag);
  res.status(201).json({ success: true, tag: newTag });
});

apiRouter.delete('/tags/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const tag = tags.find(t => t.id === id);
  if (tag) {
    notes = notes.map(n => ({
      ...n,
      tags: n.tags.filter(t => t !== tag.name),
    }));
  }
  tags = tags.filter(t => t.id !== id);
  res.json({ success: true, message: 'Tag deleted' });
});

// ---------------- NOTES ----------------
apiRouter.get('/notes', (req: Request, res: Response) => {
  const { notebook_id, tag, favorite, archived, deleted, search } = req.query;

  let filtered = [...notes];

  if (deleted === 'true') {
    filtered = filtered.filter(n => n.is_deleted);
  } else {
    filtered = filtered.filter(n => !n.is_deleted);

    if (archived === 'true') {
      filtered = filtered.filter(n => n.is_archived);
    } else if (archived === 'false' || archived === undefined) {
      filtered = filtered.filter(n => !n.is_archived);
    }

    if (favorite === 'true') {
      filtered = filtered.filter(n => n.is_favorite);
    }

    if (notebook_id) {
      filtered = filtered.filter(n => n.notebook_id === notebook_id);
    }

    if (tag) {
      filtered = filtered.filter(n => n.tags.includes(tag as string));
    }

    if (search) {
      const q = (search as string).toLowerCase().trim();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content_text.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
  }

  // Sort pinned first, then by updated_at desc
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  res.json({ success: true, notes: filtered });
});

apiRouter.get('/notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const note = notes.find(n => n.id === id);
  if (!note) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }
  res.json({ success: true, note });
});

apiRouter.post('/notes', (req: Request, res: Response) => {
  const {
    title,
    content,
    content_text,
    notebook_id,
    tags: noteTags,
    checklist,
    color,
    pinned,
    is_favorite,
  } = req.body;

  const newNote: Note = {
    id: `note_${Date.now()}`,
    user_id: currentUser.id,
    notebook_id: notebook_id || '',
    title: title ?? 'தலைப்பில்லாத குறிப்பு',
    content: content ?? '',
    content_text: content_text ?? '',
    checklist: Array.isArray(checklist) ? checklist : [],
    tags: Array.isArray(noteTags) ? noteTags : [],
    attachments: [],
    is_favorite: !!is_favorite,
    is_archived: false,
    is_deleted: false,
    pinned: !!pinned,
    color: color || '#ffffff',
    shared_with: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  notes.unshift(newNote);
  res.status(201).json({ success: true, note: newNote });
});

apiRouter.put('/notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  const existing = notes[index];
  const updatedNote: Note = {
    ...existing,
    ...req.body,
    id: existing.id,
    user_id: existing.user_id,
    updated_at: new Date().toISOString(),
  };

  notes[index] = updatedNote;
  res.json({ success: true, note: updatedNote });
});

apiRouter.delete('/notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { permanent } = req.query;

  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  if (permanent === 'true') {
    // Delete forever
    notes = notes.filter(n => n.id !== id);
    return res.json({ success: true, message: 'Note permanently deleted' });
  }

  // Soft delete into trash
  notes[index] = {
    ...notes[index],
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  res.json({ success: true, note: notes[index], message: 'Moved to trash' });
});

apiRouter.patch('/notes/:id/archive', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  const isArchived = req.body.is_archived !== undefined ? req.body.is_archived : !notes[index].is_archived;
  notes[index] = {
    ...notes[index],
    is_archived: isArchived,
    updated_at: new Date().toISOString(),
  };

  res.json({ success: true, note: notes[index] });
});

apiRouter.patch('/notes/:id/favorite', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  const isFav = req.body.is_favorite !== undefined ? req.body.is_favorite : !notes[index].is_favorite;
  notes[index] = {
    ...notes[index],
    is_favorite: isFav,
    updated_at: new Date().toISOString(),
  };

  res.json({ success: true, note: notes[index] });
});

apiRouter.patch('/notes/:id/restore', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  notes[index] = {
    ...notes[index],
    is_deleted: false,
    deleted_at: undefined,
    updated_at: new Date().toISOString(),
  };

  res.json({ success: true, note: notes[index] });
});

apiRouter.post('/notes/:id/share', (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, permission = 'viewer' } = req.body;
  const index = notes.findIndex(n => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  const sharedList = notes[index].shared_with || [];
  const existingShared = sharedList.find(s => s.email.toLowerCase() === email.toLowerCase());

  if (existingShared) {
    existingShared.permission = permission;
  } else {
    sharedList.push({
      id: `share_${Date.now()}`,
      email,
      permission,
      created_at: new Date().toISOString(),
    });
  }

  notes[index] = {
    ...notes[index],
    shared_with: [...sharedList],
    updated_at: new Date().toISOString(),
  };

  res.json({ success: true, note: notes[index], shared_with: notes[index].shared_with });
});

// ---------------- TRASH BATCH ----------------
apiRouter.post('/trash/empty', (req: Request, res: Response) => {
  notes = notes.filter(n => !n.is_deleted);
  res.json({ success: true, message: 'Trash emptied successfully' });
});

apiRouter.post('/trash/restore-all', (req: Request, res: Response) => {
  notes = notes.map(n => (n.is_deleted ? { ...n, is_deleted: false, deleted_at: undefined } : n));
  res.json({ success: true, message: 'All notes restored' });
});

// ---------------- ATTACHMENTS ----------------
apiRouter.post('/attachments', (req: Request, res: Response) => {
  const { note_id, name, url, type, size } = req.body;
  if (!note_id || !url) {
    return res.status(400).json({ success: false, message: 'note_id and url are required' });
  }

  const noteIndex = notes.findIndex(n => n.id === note_id);
  if (noteIndex === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  const newAttachment = {
    id: `att_${Date.now()}`,
    note_id,
    name: name || 'file',
    url,
    type: type || 'application/octet-stream',
    size: size || 1024,
    created_at: new Date().toISOString(),
  };

  notes[noteIndex].attachments = [...(notes[noteIndex].attachments || []), newAttachment];
  notes[noteIndex].updated_at = new Date().toISOString();

  res.status(201).json({ success: true, attachment: newAttachment, note: notes[noteIndex] });
});

apiRouter.delete('/attachments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let found = false;
  notes = notes.map(n => {
    if (n.attachments && n.attachments.some(a => a.id === id)) {
      found = true;
      return {
        ...n,
        attachments: n.attachments.filter(a => a.id !== id),
        updated_at: new Date().toISOString(),
      };
    }
    return n;
  });

  if (!found) {
    return res.status(404).json({ success: false, message: 'Attachment not found' });
  }

  res.json({ success: true, message: 'Attachment deleted' });
});

// ---------------- AI SERVICES ----------------
apiRouter.post('/ai/enhance', async (req: Request, res: Response) => {
  try {
    const { action, content, title, customPrompt, language } = req.body;
    const result = await enhanceNoteContent({
      action: action || 'summarize',
      content: content || '',
      title: title || '',
      customPrompt,
      language: language || currentUser.language,
    });
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, noteContext } = req.body;
    const result = await chatWithGemini(messages || [], noteContext);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/ai/transcribe', async (req: Request, res: Response) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ success: false, message: 'Audio data is required' });
    }
    const result = await transcribeAudio(audio, mimeType);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

apiRouter.post('/ai/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }
    const result = await convertTextToSpeech(text);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ---------------- GOOGLE WORKSPACE SYNC & INTEGRATION ----------------
apiRouter.get('/workspace/contacts', (req: Request, res: Response) => {
  // Pre-populated Google Contacts
  const contacts = [
    { id: 'c1', name: 'முத்துகுமார் (Muthukumar)', email: 'muthu.dev@example.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { id: 'c2', name: 'கவிதா ராஜ் (Kavitha Raj)', email: 'kavitha.design@example.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
    { id: 'c3', name: 'அருண் பிரகாஷ் (Arun Prakash)', email: 'arun.prakash@example.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
    { id: 'c4', name: 'பிரியா சுந்தர் (Priya Sundar)', email: 'priya.sundar@example.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80' },
  ];
  res.json({ success: true, contacts });
});

apiRouter.post('/workspace/drive/export', (req: Request, res: Response) => {
  const { note_id } = req.body;
  const note = notes.find(n => n.id === note_id);
  if (!note) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  res.json({
    success: true,
    driveFileId: `drive_doc_${Date.now()}`,
    fileUrl: `https://drive.google.com/file/d/drive_${note.id}/view`,
    message: `"${note.title}" கூகிள் டிரைவில் காப்புப்பிரதி செய்யப்பட்டது (Google Drive Sync Success)`,
  });
});

apiRouter.post('/workspace/calendar/event', (req: Request, res: Response) => {
  const { title, description, start_time } = req.body;
  res.json({
    success: true,
    eventId: `cal_${Date.now()}`,
    htmlLink: `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title || 'Note Reminder')}`,
    message: `கூகிள் காலண்டரில் நிகழ்வு/நினைவூட்டல் சேர்க்கப்பட்டது (Google Calendar Event Created)`,
  });
});

apiRouter.post('/workspace/docs/export', (req: Request, res: Response) => {
  const { note_id } = req.body;
  const note = notes.find(n => n.id === note_id);
  res.json({
    success: true,
    docId: `doc_${Date.now()}`,
    docUrl: `https://docs.google.com/document/d/doc_${Date.now()}/edit`,
    message: `"${note ? note.title : 'குறிப்பு'}" கூகிள் டாக்ஸ் ஆவணமாக உருவாக்கப்பட்டது`,
  });
});

// ---------------- DATA BACKUP & RESTORE ----------------
apiRouter.get('/data/export', (req: Request, res: Response) => {
  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    user: currentUser,
    notebooks,
    tags,
    notes,
  };
  res.json(exportData);
});

apiRouter.post('/data/import', (req: Request, res: Response) => {
  try {
    const { notebooks: newNbs, tags: newTags, notes: newNotes } = req.body;
    if (Array.isArray(newNbs)) notebooks = [...newNbs];
    if (Array.isArray(newTags)) tags = [...newTags];
    if (Array.isArray(newNotes)) notes = [...newNotes];

    res.json({
      success: true,
      message: 'தரவு வெற்றிகரமாக இறக்குமதி செய்யப்பட்டது (Data imported successfully)',
      counts: {
        notebooks: notebooks.length,
        tags: tags.length,
        notes: notes.length,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Invalid data format' });
  }
});
