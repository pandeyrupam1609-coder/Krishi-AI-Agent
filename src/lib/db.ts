import mongoose from 'mongoose';
import { jsonDb } from './jsonDb';

const MONGODB_URI = process.env.MONGODB_URI;
const useMongoDB = !!MONGODB_URI;

let isConnected = false;

// Define Schemas for Mongoose
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  phone: String,
  state: String,
  farmSize: String,
  cropTypes: [String],
  createdAt: { type: Date, default: Date.now }
});

const DiagnosisSchema = new mongoose.Schema({
  userId: String,
  cropName: { type: String, required: true },
  healthStatus: { type: String, enum: ['Healthy', 'Diseased'], required: true },
  diseaseName: String,
  confidence: { type: Number, required: true },
  symptoms: String,
  organicRemedies: String,
  chemicalRemedies: String,
  fertilizerRecommendations: String,
  irrigationRecommendations: String,
  imageUrl: String,
  growthStage: String,
  weatherSummary: String,
  riskAlerts: String,
  recommendedMedicine: String,
  marketPrices: String,
  governmentSchemes: String,
  preventiveTips: String,
  nextRecommendedAction: String,
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  userId: String,
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['weather', 'disease', 'price', 'system'], required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Setup Models
let UserModel: any;
let DiagnosisModel: any;
let NotificationModel: any;

try {
  UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
  DiagnosisModel = mongoose.models.Diagnosis || mongoose.model('Diagnosis', DiagnosisSchema);
  NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
} catch (e) {
  // Fallback in case of compilation issues in hot reloads
}

async function connectToMongo() {
  if (isConnected) return;
  if (!MONGODB_URI) return;
  try {
    const opts = {
      bufferCommands: false,
    };
    await mongoose.connect(MONGODB_URI, opts);
    isConnected = true;
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Failed to connect to MongoDB, falling back to local JSON database.', error);
  }
}

export const db = {
  isLocal: !useMongoDB,
  users: {
    async findOne(query: any) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const user = await UserModel.findOne(query).lean();
          if (!user) return null;
          return { ...user, id: user._id.toString() };
        } catch (error) {
          console.error('MongoDB findOne error, using local fallback:', error);
        }
      }
      return jsonDb.users.findOne(query);
    },
    async create(data: any) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const user = await UserModel.create({
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name,
            phone: data.phone,
            state: data.state,
            farmSize: data.farmSize,
            cropTypes: data.cropTypes
          });
          return { ...user.toObject(), id: user._id.toString() };
        } catch (error) {
          console.error('MongoDB user create error, using local fallback:', error);
        }
      }
      return jsonDb.users.create(data);
    },
    async update(id: string, updates: any) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
          if (!user) return null;
          return { ...user, id: user._id.toString() };
        } catch (error) {
          console.error('MongoDB user update error, using local fallback:', error);
        }
      }
      return jsonDb.users.update(id, updates);
    }
  },
  diagnoses: {
    async find(query: any = {}) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const list = await DiagnosisModel.find(query).sort({ createdAt: -1 }).lean();
          return list.map((d: any) => ({ ...d, id: d._id.toString() }));
        } catch (error) {
          console.error('MongoDB diagnoses find error, using local fallback:', error);
        }
      }
      return jsonDb.diagnoses.find(query);
    },
    async create(data: any) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const diag = await DiagnosisModel.create(data);
          return { ...diag.toObject(), id: diag._id.toString() };
        } catch (error) {
          console.error('MongoDB diagnoses create error, using local fallback:', error);
        }
      }
      return jsonDb.diagnoses.create(data);
    }
  },
  notifications: {
    async find(query: any = {}) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const list = await NotificationModel.find(query).sort({ createdAt: -1 }).lean();
          return list.map((n: any) => ({ ...n, id: n._id.toString() }));
        } catch (error) {
          console.error('MongoDB notifications find error, using local fallback:', error);
        }
      }
      return jsonDb.notifications.find(query);
    },
    async create(data: any) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const notif = await NotificationModel.create(data);
          return { ...notif.toObject(), id: notif._id.toString() };
        } catch (error) {
          console.error('MongoDB notification create error, using local fallback:', error);
        }
      }
      return jsonDb.notifications.create(data);
    },
    async markAsRead(id: string) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const notif = await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true }).lean();
          if (!notif) return null;
          return { ...notif, id: notif._id.toString() };
        } catch (error) {
          console.error('MongoDB notification markAsRead error, using local fallback:', error);
        }
      }
      return jsonDb.notifications.markAsRead(id);
    },
    async markAllAsRead(userId?: string) {
      if (useMongoDB) {
        try {
          await connectToMongo();
          const query = userId ? { userId } : {};
          await NotificationModel.updateMany(query, { isRead: true });
          return true;
        } catch (error) {
          console.error('MongoDB notifications markAllAsRead error, using local fallback:', error);
        }
      }
      return jsonDb.notifications.markAllAsRead(userId);
    }
  }
};
