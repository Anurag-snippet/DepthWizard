import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      enum: ['relative', 'calibrated'],
      default: 'relative',
    },
    status: {
      type: String,
      enum: ['uploaded', 'queued', 'processing', 'completed', 'failed'],
      default: 'uploaded',
    },
    stage: {
      type: String,
      default: 'ready_for_inference',
    },
    uploadPath: {
      type: String,
      default: null,
    },
    originalFilename: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    referenceDemPath: {
      type: String,
      default: null,
    },
    referenceDemFilename: {
      type: String,
      default: null,
    },
    referenceDemType: {
      type: String,
      default: null,
    },
    gcpJson: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    processing: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    imageSrc: {
      type: String,
      default: null,
    },
    depthMapSrc: {
      type: String,
      default: null,
    },
    grayscaleDepthSrc: {
      type: String,
      default: null,
    },
    rawDisparitySrc: {
      type: String,
      default: null,
    },
    elevationMapSrc: {
      type: String,
      default: null,
    },
    elevationRawSrc: {
      type: String,
      default: null,
    },
    inferenceStats: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: false,
    minimize: false,
  }
);

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
