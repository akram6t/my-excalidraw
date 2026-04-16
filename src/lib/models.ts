import mongoose, { Schema, Document } from 'mongoose';

// ── Types ──

export interface IProject extends Document {
  name: string;
  description: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWhiteboard extends Document {
  title: string;
  data: string;
  order: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILibrary extends Document {
  name: string;
  data: string;
  createdAt: Date;
}

// ── Schemas ──

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    color: { type: String, default: '#6366f1' },
  },
  { timestamps: true }
);

const WhiteboardSchema = new Schema<IWhiteboard>(
  {
    title: { type: String, required: true },
    data: { type: String, default: '{}' },
    order: { type: Number, default: 0 },
    projectId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const LibrarySchema = new Schema<ILibrary>(
  {
    name: { type: String, required: true, unique: true },
    data: { type: String, required: true },
  },
  { timestamps: true }
);

// ── Models ──

export const Project =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export const Whiteboard =
  mongoose.models.Whiteboard ||
  mongoose.model<IWhiteboard>('Whiteboard', WhiteboardSchema);

export const Library =
  mongoose.models.Library || mongoose.model<ILibrary>('Library', LibrarySchema);
