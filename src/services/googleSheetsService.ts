import { AppData, User, Session, LiveSession } from '../types';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
const SHEET_ID = '1tzF7vL_vuwTtbb9bicJHDUE8ZAR6XlrlVuYXrttmhO0';

// Helper to parse CSV to JSON
function parseCsv(csv: string) {
  if (!csv || !csv.includes(',')) return [];
  const lines = csv.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));
}

async function fetchWithTimeout(url: string, options: any = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export const googleSheetsService = {
  async fetchData(): Promise<AppData> {
    try {
      if (SCRIPT_URL && SCRIPT_URL.startsWith('http')) {
        const response = await fetchWithTimeout(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'get_data' }),
        });
        if (response.ok) return response.json();
      }

      // Fallback: Read via CSV export
      const fetchCsv = async (sheetName: string) => {
        const res = await fetchWithTimeout(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`);
        if (!res.ok) throw new Error(`Failed to fetch ${sheetName}`);
        return res.text();
      };

      const [usersCsv, sessionsCsv, liveCsv] = await Promise.all([
        fetchCsv('users'),
        fetchCsv('sessions'),
        fetchCsv('live_sessions'),
      ]);

      return {
        users: (parseCsv(usersCsv) as User[]).filter(u => u && u.telegram_id),
        sessions: (parseCsv(sessionsCsv) as any[])
          .map(s => ({
            ...s,
            duration_seconds: parseInt(s.duration_seconds) || 0,
            date: s.date || new Date().toISOString()
          }))
          .filter(s => s.telegram_id && !isNaN(new Date(s.date).getTime())) as Session[],
        live_sessions: (parseCsv(liveCsv) as LiveSession[]).filter(s => s && s.telegram_id),
      };
    } catch (error) {
      console.warn('Data fetch error, returning demo data:', error);
      // Fallback to demo data instead of empty arrays
      return {
        users: [
          { telegram_id: '1', name: 'Алексей', username: 'alex', photo: 'https://picsum.photos/seed/1/100', created_at: new Date().toISOString() },
          { telegram_id: '2', name: 'Мария', username: 'maria', photo: 'https://picsum.photos/seed/2/100', created_at: new Date().toISOString() },
          { telegram_id: '3', name: 'Иван', username: 'ivan', photo: 'https://picsum.photos/seed/3/100', created_at: new Date().toISOString() }
        ],
        sessions: [
          { session_id: 's1', telegram_id: '1', duration_seconds: 600, date: new Date().toISOString(), intention: 'Спокойствие', mood: '🙂' },
          { session_id: 's2', telegram_id: '2', duration_seconds: 300, date: new Date().toISOString(), intention: 'Энергия', mood: '🙂' }
        ],
        live_sessions: [],
      };
    }
  },

  async upsertUser(user: Partial<User>): Promise<void> {
    if (!SCRIPT_URL || !SCRIPT_URL.startsWith('http')) {
      console.warn('Cannot write user: VITE_GOOGLE_SCRIPT_URL not set');
      return;
    }
    await fetchWithTimeout(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'upsert_user', user }),
    });
  },

  async startSession(telegram_id: string, intention: string): Promise<void> {
    if (!SCRIPT_URL || !SCRIPT_URL.startsWith('http')) {
      console.warn('Cannot start session: VITE_GOOGLE_SCRIPT_URL not set');
      return;
    }
    await fetchWithTimeout(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'start_session', telegram_id, intention }),
    });
  },

  async endSession(telegram_id: string, duration_seconds: number, intention: string, mood: string): Promise<void> {
    if (!SCRIPT_URL || !SCRIPT_URL.startsWith('http')) {
      console.warn('Cannot end session: VITE_GOOGLE_SCRIPT_URL not set');
      return;
    }
    await fetchWithTimeout(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'end_session', telegram_id, duration_seconds, intention, mood }),
    });
  },
};
