const mongoose = require("mongoose");
const path = require("path");

const DEFAULT_MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb+srv://alone:vinaykumar@alone.g42tkzg.mongodb.net/Astrix?retryWrites=true&w=majority&appName=alone";

let isConnecting = false;
let isConnected = false;

// ── 1. Snapshot Schema (Full Historical Backups) ──────────────
const snapshotSchema = new mongoose.Schema(
  {
    snapshotId: { type: String, required: true, unique: true, index: true },
    label: { type: String, default: "System Backup" },
    timestamp: { type: Number, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    stats: {
      totalFiles: { type: Number, default: 0 },
      totalRecords: { type: Number, default: 0 },
      fileSizes: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    files: { type: mongoose.Schema.Types.Mixed, required: true },
    isLatest: { type: Boolean, default: false, index: true },
  },
  { collection: "astrix_snapshots", timestamps: true }
);

// ── 2. Live Config Schema (Individual Module Documents) ───────
const configSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "antinukeConfig.json", "welcomeConfig.json"
    moduleName: { type: String, required: true, index: true }, // e.g. "antinuke", "welcome", "automod", "autoresponder"
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    recordCount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "astrix_configs", timestamps: true }
);

const SnapshotModel = mongoose.models.AstrixSnapshot || mongoose.model("AstrixSnapshot", snapshotSchema);
const ConfigModel = mongoose.models.AstrixConfig || mongoose.model("AstrixConfig", configSchema);

/**
 * Initializes and caches MongoDB Connection
 */
async function connect(uri = DEFAULT_MONGO_URI) {
  if (isConnected && mongoose.connection.readyState === 1) return true;
  if (isConnecting) {
    // Wait for in-flight connection
    let checks = 0;
    while (isConnecting && checks < 20) {
      await new Promise((r) => setTimeout(r, 250));
      checks++;
      if (isConnected) return true;
    }
  }

  isConnecting = true;
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
    isConnected = true;
    isConnecting = false;
    console.log("[MongoBackup] 🟢 Connected to MongoDB Atlas successfully.");
    return true;
  } catch (err) {
    isConnecting = false;
    isConnected = false;
    console.error("[MongoBackup] 🔴 Failed to connect to MongoDB:", err.message);
    return false;
  }
}

/**
 * Maps filename to human-readable module category
 */
function getModuleName(filename) {
  const clean = filename.replace(/\.(json|js)$/i, "");
  if (clean.includes("antinuke") || clean.includes("nuke")) return "antinuke";
  if (clean.includes("antiraid")) return "antiraid";
  if (clean.includes("automod")) return "automod";
  if (clean.includes("welcome")) return "welcome";
  if (clean.includes("goodbye")) return "goodbye";
  if (clean.includes("configManager") || clean.includes("trigger") || clean.includes("autoresponder")) return "autoresponder";
  if (clean.includes("noprefix")) return "noprefix";
  if (clean.includes("customRoles")) return "customroles";
  if (clean.includes("giveaway")) return "giveaway";
  if (clean.includes("leveling")) return "leveling";
  if (clean.includes("logging")) return "logging";
  if (clean.includes("ticket")) return "ticket";
  if (clean.includes("starboard")) return "starboard";
  if (clean.includes("warn")) return "moderation";
  if (clean.includes("j2c")) return "join_to_create";
  if (clean.includes("prefix")) return "prefixes";
  if (clean.includes("badge")) return "badges";
  return clean;
}

/**
 * Uploads a consolidated backup bundle to MongoDB:
 * 1. Stores complete snapshot in astrix_snapshots
 * 2. Synchronizes each individual module in astrix_configs
 */
async function uploadSnapshot(bundle) {
  try {
    const ready = await connect();
    if (!ready) return false;

    const snapshotId = `snapshot-${bundle.timestamp}`;

    // 1. Mark existing latest snapshots as false
    await SnapshotModel.updateMany({ isLatest: true }, { $set: { isLatest: false } }).catch(() => null);

    // 2. Upsert Snapshot Document
    await SnapshotModel.findOneAndUpdate(
      { snapshotId },
      {
        snapshotId,
        label: bundle.label || "System Backup",
        timestamp: bundle.timestamp,
        createdAt: new Date(bundle.timestamp),
        stats: bundle.stats || {},
        files: bundle.files || {},
        isLatest: true,
      },
      { upsert: true, returnDocument: "after" }
    );

    // 3. Upsert each module file into astrix_configs for granular viewing & live access
    if (bundle.files && typeof bundle.files === "object") {
      const bulkOps = [];
      for (const [filename, fileData] of Object.entries(bundle.files)) {
        const moduleName = getModuleName(filename);
        let recCount = 0;
        if (Array.isArray(fileData)) recCount = fileData.length;
        else if (typeof fileData === "object" && fileData !== null) recCount = Object.keys(fileData).length;

        bulkOps.push({
          updateOne: {
            filter: { _id: filename },
            update: {
              $set: {
                _id: filename,
                moduleName,
                data: fileData,
                recordCount: recCount,
                updatedAt: new Date(),
              },
            },
            upsert: true,
          },
        });
      }

      if (bulkOps.length > 0) {
        await ConfigModel.bulkWrite(bulkOps, { ordered: false }).catch((e) =>
          console.error("[MongoBackup] Bulk config update notice:", e.message)
        );
      }
    }

    // 4. Prune older snapshots in Mongo if exceeding 30
    const totalSnapshots = await SnapshotModel.countDocuments();
    if (totalSnapshots > 30) {
      const oldest = await SnapshotModel.find({}, { _id: 1 })
        .sort({ timestamp: 1 })
        .limit(totalSnapshots - 30);
      const idsToDelete = oldest.map((d) => d._id);
      await SnapshotModel.deleteMany({ _id: { $in: idsToDelete } }).catch(() => null);
    }

    console.log(`[MongoBackup] ☁️ Successfully backed up ${bundle.stats?.totalFiles || 0} modules to MongoDB.`);
    return true;
  } catch (err) {
    console.error("[MongoBackup] Failed to upload snapshot to MongoDB:", err.message);
    return false;
  }
}

/**
 * Fetches the latest backup snapshot from MongoDB
 */
async function fetchLatestSnapshot() {
  try {
    const ready = await connect();
    if (!ready) return null;

    let doc = await SnapshotModel.findOne({ isLatest: true }).lean();
    if (!doc) {
      doc = await SnapshotModel.findOne().sort({ timestamp: -1 }).lean();
    }
    return doc;
  } catch (err) {
    console.error("[MongoBackup] Failed to fetch latest snapshot from MongoDB:", err.message);
    return null;
  }
}

/**
 * Fetches historical list of snapshots from MongoDB
 */
async function fetchSnapshotList(limit = 20) {
  try {
    const ready = await connect();
    if (!ready) return [];

    const list = await SnapshotModel.find(
      {},
      { snapshotId: 1, label: 1, timestamp: 1, createdAt: 1, stats: 1, isLatest: 1 }
    )
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return list;
  } catch (err) {
    console.error("[MongoBackup] Failed to list snapshots from MongoDB:", err.message);
    return [];
  }
}

/**
 * Fetches all live config files directly from MongoDB
 */
async function fetchAllConfigs() {
  try {
    const ready = await connect();
    if (!ready) return {};

    const docs = await ConfigModel.find({}).lean();
    const result = {};
    for (const doc of docs) {
      result[doc._id] = doc.data;
    }
    return result;
  } catch (err) {
    console.error("[MongoBackup] Failed to fetch all configs from MongoDB:", err.message);
    return {};
  }
}

/**
 * Returns connection state
 */
function getStatus() {
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    statusText: state === 1 ? "Connected" : state === 2 ? "Connecting" : "Disconnected",
    host: mongoose.connection.host || "alone.g42tkzg.mongodb.net",
    dbName: mongoose.connection.name || "Astrix",
  };
}

module.exports = {
  connect,
  uploadSnapshot,
  fetchLatestSnapshot,
  fetchSnapshotList,
  fetchAllConfigs,
  getStatus,
  SnapshotModel,
  ConfigModel,
  DEFAULT_MONGO_URI,
};
