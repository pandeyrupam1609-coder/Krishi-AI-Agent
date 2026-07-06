import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  state?: string;
  farmSize?: string;
  cropTypes?: string[];
  createdAt: string;
}

export interface Diagnosis {
  id: string;
  userId?: string;
  cropName: string;
  healthStatus: 'Healthy' | 'Diseased';
  diseaseName?: string;
  confidence: number;
  symptoms?: string;
  organicRemedies?: string;
  chemicalRemedies?: string;
  fertilizerRecommendations?: string;
  irrigationRecommendations?: string;
  imageUrl?: string;
  createdAt: string;
  
  growthStage?: string;
  weatherSummary?: string;
  riskAlerts?: string;
  recommendedMedicine?: string;
  marketPrices?: string;
  governmentSchemes?: string;
  preventiveTips?: string;
  nextRecommendedAction?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'weather' | 'disease' | 'price' | 'system';
  isRead: boolean;
  createdAt: string;
}

interface DbSchema {
  users: User[];
  diagnoses: Diagnosis[];
  notifications: Notification[];
}

const defaultDb: DbSchema = {
  users: [],
  diagnoses: [],
  notifications: []
};

// Help helper to guarantee database file exists
async function ensureDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error ensuring local database directory:', error);
  }
}

async function getDb(): Promise<DbSchema> {
  await ensureDb();
  try {
    const content = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(content) as DbSchema;
  } catch (error) {
    console.error('Error reading local database file, returning default:', error);
    return defaultDb;
  }
}

async function saveDb(db: DbSchema): Promise<void> {
  await ensureDb();
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local database file:', error);
  }
}

export const jsonDb = {
  users: {
    async find() {
      const db = await getDb();
      return db.users;
    },
    async findOne(query: Partial<User>) {
      const db = await getDb();
      return db.users.find(u => {
        for (const [key, value] of Object.entries(query)) {
          if (u[key as keyof User] !== value) return false;
        }
        return true;
      });
    },
    async create(user: Omit<User, 'id' | 'createdAt'>) {
      const db = await getDb();
      const newUser: User = {
        ...user,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      await saveDb(db);
      return newUser;
    },
    async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'email'>>) {
      const db = await getDb();
      const index = db.users.findIndex(u => u.id === id);
      if (index === -1) return null;
      db.users[index] = { ...db.users[index], ...updates };
      await saveDb(db);
      return db.users[index];
    }
  },
  diagnoses: {
    async find(query: Partial<Diagnosis> = {}) {
      const db = await getDb();
      return db.diagnoses.filter(d => {
        for (const [key, value] of Object.entries(query)) {
          if (d[key as keyof Diagnosis] !== value) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async create(diagnosis: Omit<Diagnosis, 'id' | 'createdAt'>) {
      const db = await getDb();
      const newDiag: Diagnosis = {
        ...diagnosis,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString()
      };
      db.diagnoses.push(newDiag);
      await saveDb(db);
      return newDiag;
    }
  },
  notifications: {
    async find(query: Partial<Notification> = {}) {
      const db = await getDb();
      return db.notifications.filter(n => {
        for (const [key, value] of Object.entries(query)) {
          if (n[key as keyof Notification] !== value) return false;
        }
        return true;
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async create(notification: Omit<Notification, 'id' | 'createdAt'>) {
      const db = await getDb();
      const newNotif: Notification = {
        ...notification,
        id: Math.random().toString(36).substring(2, 11),
        createdAt: new Date().toISOString()
      };
      db.notifications.push(newNotif);
      await saveDb(db);
      return newNotif;
    },
    async markAsRead(id: string) {
      const db = await getDb();
      const index = db.notifications.findIndex(n => n.id === id);
      if (index === -1) return null;
      db.notifications[index].isRead = true;
      await saveDb(db);
      return db.notifications[index];
    },
    async markAllAsRead(userId?: string) {
      const db = await getDb();
      db.notifications = db.notifications.map(n => {
        if (userId && n.userId !== userId) return n;
        return { ...n, isRead: true };
      });
      await saveDb(db);
      return true;
    }
  }
};
