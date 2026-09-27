const fs = require("fs");
const path = require("path");
const mongoBackup = require("./mongoBackup");

const LIB_DIR = path.resolve(__dirname);
const ROOT_DIR = path.resolve(__dirname, "../..");
const BACKUP_DIR = path.join(ROOT_DIR, "backups");
const SNAPSHOT_DIR = path.join(BACKUP_DIR, "snapshots");
const VAULT_FILE = path.join(BACKUP_DIR, "master_vault.json");

/**
 * Complete list of all core system configuration, data & state files
 */
const TRACKED_FILES = [
  "antinukeConfig.json",
  "nukeConfig.json",
  "antiraidConfig.json",
  "automodConfig.json",
  "welcomeConfig.json",
  "goodbyeConfig.json",
  "configManagerConfig.json", // Autoresponder phrases, triggers, reaction roles, server setups!
  "noprefixConfig.json",
  "customRolesConfig.json",
  "customRolesData.json",
  "serverConfig.json",
  "giveaways.json",
  "guildPrefixes.json",
  "guildPresets.json",
  "j2cConfig.json",
  "levelingConfig.json",
  "levelingData.json",
  "loggingConfig.json",
  "loggingData.json",
  "pollData.json",
  "starboardConfig.json",
  "suggestionData.json",
  "ticketConfig.json",
  "warns.json",
  "afk.json",
  "birthdayConfig.json",
  "bumpReminderConfig.json",
  "userBadges.json",
  "statsData.json",
  "feedbackData.json",
  "embedData.json",
  "config.json",
];

/**
 * Dynamically resolves all active JSON configuration & data files in src/lib
 */
function getAllTrackedFiles() {
  const set = new Set(TRACKED_FILES);
  try {
    const files = fs.readdirSync(LIB_DIR);
    for (const file of files) {
      if (
        file.endsWith(".json") &&
        file !== "emojis.json" &&
        file !== "categories.json" &&
        !file.endsWith(".tmp")
      ) {
        set.add(file);
      }
    }
  } catch (_) {}
  return Array.from(set);
}

// Ensure essential backup directories exist
function ensureDirs() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  } catch (err) {
    console.error("[BackupManager] Failed to create backup directories:", err.message);
  }
}

/**
 * Counts logical records in a parsed JSON structure
 */
function countRecords(data) {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object") {
    if (data.users || data.servers || data.owners) {
      return (
        (data.users?.length || 0) +
        (data.servers?.length || 0) +
        (data.owners?.length || 0) +
        (data.roles?.length || 0)
      );
    }
    return Object.keys(data).length;
  }
  return 1;
}

/**
 * Reads a single JSON file safely
 */
function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8").trim();
    if (!raw || raw.length === 0) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Writes a JSON file safely using atomic temp writing
 */
function writeJsonSafe(filePath, data) {
  try {
    const parent = path.dirname(filePath);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });

    const tempPath = `${filePath}.${Date.now()}.tmp`;
    const str = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, str, "utf8");
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch (_) {
      return false;
    }
  }
}

/**
 * Creates an atomic consolidated snapshot of all bot configurations
 */
function createSnapshot(label = "Manual Backup") {
  ensureDirs();
  const timestamp = Date.now();
  const bundle = {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    timestamp,
    label,
    stats: {
      totalFiles: 0,
      totalRecords: 0,
      fileSizes: {},
    },
    files: {},
  };

  let totalRecords = 0;
  let fileCount = 0;
  const activeFiles = getAllTrackedFiles();

  for (const filename of activeFiles) {
    const fullPath = path.join(LIB_DIR, filename);
    const data = readJsonSafe(fullPath);
    if (data !== null) {
      bundle.files[filename] = data;
      const recs = countRecords(data);
      totalRecords += recs;
      fileCount++;
      try {
        bundle.stats.fileSizes[filename] = fs.statSync(fullPath).size;
      } catch (_) {}
    }
  }

  bundle.stats.totalFiles = fileCount;
  bundle.stats.totalRecords = totalRecords;

  // 1. Update Master Vault
  writeJsonSafe(VAULT_FILE, bundle);

  // 2. Save timestamped snapshot
  const snapshotFile = path.join(SNAPSHOT_DIR, `snapshot-${timestamp}.json`);
  writeJsonSafe(snapshotFile, bundle);

  // 3. Keep latest 15 snapshots, prune older
  pruneOldSnapshots(15);

  // 4. Asynchronously push to MongoDB Cloud (non-blocking for high speed)
  mongoBackup.uploadSnapshot(bundle).catch((err) => {
    console.error("[BackupManager] Non-blocking Mongo upload error:", err.message);
  });

  return bundle;
}

/**
 * Creates snapshot and explicitly waits for MongoDB Cloud confirmation
 */
async function createSnapshotAsync(label = "Manual Backup") {
  const bundle = createSnapshot(label);
  let cloudSuccess = false;
  try {
    cloudSuccess = await mongoBackup.uploadSnapshot(bundle);
  } catch (err) {
    console.error("[BackupManager] Cloud sync error:", err.message);
  }
  return { snapshot: bundle, cloudSuccess };
}

/**
 * Deletes older snapshots exceeding maxKeep count
 */
function pruneOldSnapshots(maxKeep = 15) {
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) return;
    const files = fs
      .readdirSync(SNAPSHOT_DIR)
      .filter((f) => f.startsWith("snapshot-") && f.endsWith(".json"))
      .map((f) => ({
        name: f,
        path: path.join(SNAPSHOT_DIR, f),
        time: fs.statSync(path.join(SNAPSHOT_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > maxKeep) {
      const toDelete = files.slice(maxKeep);
      for (const item of toDelete) {
        fs.unlinkSync(item.path);
      }
    }
  } catch (_) {}
}

/**
 * Edits the label of an existing snapshot
 */
function editSnapshot(snapshotId, newLabel) {
  ensureDirs();
  const snapshots = listSnapshots();
  const target = snapshots.find(
    (s) => s.id === snapshotId || s.id === `snapshot-${snapshotId}` || s.fileName.includes(snapshotId)
  );

  if (!target) {
    throw new Error(`Snapshot \`${snapshotId}\` was not found on disk.`);
  }

  const data = readJsonSafe(target.filePath);
  if (!data) {
    throw new Error("Unable to read target snapshot content.");
  }

  data.label = newLabel;
  data.updatedAt = new Date().toISOString();
  writeJsonSafe(target.filePath, data);

  // If this target is also the latest vault, update vault label
  const vault = readJsonSafe(VAULT_FILE);
  if (vault && vault.timestamp === data.timestamp) {
    vault.label = newLabel;
    writeJsonSafe(VAULT_FILE, vault);
  }

  return { id: target.id, label: newLabel, timestamp: data.timestamp };
}

/**
 * Deletes a single snapshot by ID
 */
function deleteSnapshot(snapshotId) {
  ensureDirs();
  const snapshots = listSnapshots();
  const target = snapshots.find(
    (s) => s.id === snapshotId || s.id === `snapshot-${snapshotId}` || s.fileName.includes(snapshotId)
  );

  if (!target) {
    throw new Error(`Snapshot \`${snapshotId}\` was not found.`);
  }

  fs.unlinkSync(target.filePath);
  return { id: target.id, label: target.label };
}

/**
 * Clears all stored historical snapshots
 */
function clearAllSnapshots() {
  ensureDirs();
  if (!fs.existsSync(SNAPSHOT_DIR)) return { deletedCount: 0 };

  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.startsWith("snapshot-") && f.endsWith(".json"));

  let deletedCount = 0;
  for (const f of files) {
    try {
      fs.unlinkSync(path.join(SNAPSHOT_DIR, f));
      deletedCount++;
    } catch (_) {}
  }

  return { deletedCount };
}

/**
 * Lists all available snapshots on disk
 */
function listSnapshots() {
  ensureDirs();
  if (!fs.existsSync(SNAPSHOT_DIR)) return [];

  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.startsWith("snapshot-") && f.endsWith(".json"))
    .map((f) => {
      const filePath = path.join(SNAPSHOT_DIR, f);
      const stat = fs.statSync(filePath);
      const data = readJsonSafe(filePath);
      return {
        id: f.replace(".json", ""),
        fileName: f,
        filePath,
        timestamp: data?.timestamp || stat.mtimeMs,
        createdAt: data?.createdAt || new Date(stat.mtimeMs).toISOString(),
        label: data?.label || "Snapshot",
        totalFiles: data?.stats?.totalFiles || 0,
        totalRecords: data?.stats?.totalRecords || 0,
        sizeBytes: stat.size,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return files;
}

/**
 * Returns real-time live statistics across all modules and memory
 */
function getRealtimeStats() {
  ensureDirs();
  const vault = readJsonSafe(VAULT_FILE);
  const snapshots = listSnapshots();

  let totalDiskRecords = 0;
  let activeFiles = 0;
  let totalDiskBytes = 0;

  const allTracked = getAllTrackedFiles();
  for (const f of allTracked) {
    const fullPath = path.join(LIB_DIR, f);
    const data = readJsonSafe(fullPath);
    if (data) {
      activeFiles++;
      totalDiskRecords += countRecords(data);
      try {
        totalDiskBytes += fs.statSync(fullPath).size;
      } catch (_) {}
    }
  }

  const mem = process.memoryUsage();

  return {
    vaultExists: Boolean(vault),
    vaultTimestamp: vault?.timestamp || null,
    vaultCreatedAt: vault?.createdAt || null,
    vaultLabel: vault?.label || "None",
    vaultRecords: vault?.stats?.totalRecords || 0,
    trackedFilesCount: allTracked.length,
    activeFilesOnDisk: activeFiles,
    totalDiskRecords,
    totalDiskBytes,
    snapshotCount: snapshots.length,
    latestSnapshot: snapshots[0] || null,
    processUptimeSec: Math.floor(process.uptime()),
    ramUsageMb: (mem.rss / 1024 / 1024).toFixed(1),
    mongo: mongoBackup.getStatus(),
  };
}

/**
 * AUTO-HEAL ON STARTUP:
 * 1. Checks local files on disk vs master vault.
 * 2. If master vault is empty or missing on disk, attempts to pull the latest snapshot from MongoDB Atlas.
 * 3. Restores any missing, blank, or wiped configuration files automatically!
 */
async function verifyAndAutoHeal() {
  ensureDirs();
  let vault = readJsonSafe(VAULT_FILE);

  // If local vault doesn't exist or is empty, try to fetch from MongoDB Atlas
  if (!vault || !vault.files || Object.keys(vault.files).length === 0) {
    console.log("[BackupManager] 🔍 No local Master Vault found. Checking MongoDB Atlas for cloud backup...");
    try {
      const cloudSnapshot = await mongoBackup.fetchLatestSnapshot();
      if (cloudSnapshot && cloudSnapshot.files && Object.keys(cloudSnapshot.files).length > 0) {
        vault = {
          version: "1.0.0",
          createdAt: cloudSnapshot.createdAt || new Date().toISOString(),
          timestamp: cloudSnapshot.timestamp || Date.now(),
          label: cloudSnapshot.label || "Cloud Restored Baseline",
          stats: cloudSnapshot.stats || {},
          files: cloudSnapshot.files,
        };
        writeJsonSafe(VAULT_FILE, vault);
        console.log(`[BackupManager] ☁️ Restored Master Vault from MongoDB Atlas (${cloudSnapshot.stats?.totalFiles || Object.keys(vault.files).length} files)!`);
      }
    } catch (err) {
      console.error("[BackupManager] Could not load cloud backup from Mongo on boot:", err.message);
    }
  }

  // If still no vault, initialize from whatever is currently on disk
  if (!vault || !vault.files || Object.keys(vault.files).length === 0) {
    createSnapshot("Initial Master Vault Baseline");
    console.log("[BackupManager] 📦 Initialized Master Vault baseline from current files.");
    return { healed: 0, totalFiles: 0 };
  }

  let healedCount = 0;
  let vaultUpdated = false;
  const allTracked = getAllTrackedFiles();

  for (const filename of allTracked) {
    const fullPath = path.join(LIB_DIR, filename);
    const diskData = readJsonSafe(fullPath);
    const vaultData = vault.files[filename];

    const diskRecords = countRecords(diskData);
    const vaultRecords = countRecords(vaultData);

    // Case 1: Disk file was wiped out or truncated to empty ({}) while vault has real data!
    if (
      vaultData &&
      (!diskData ||
        (diskRecords === 0 && vaultRecords > 0) ||
        (diskRecords < vaultRecords && diskRecords <= 1 && vaultRecords >= 2))
    ) {
      writeJsonSafe(fullPath, vaultData);
      healedCount++;
      console.log(
        `[BackupManager] 🛡️ AUTO-HEAL: Restored "${filename}" from vault (${vaultRecords} records restored after update)!`
      );
    }
    // Case 2: Disk file has new/updated configurations -> update vault
    else if (diskData && diskRecords >= vaultRecords) {
      if (JSON.stringify(diskData) !== JSON.stringify(vaultData)) {
        vault.files[filename] = diskData;
        vaultUpdated = true;
      }
    }
  }

  if (vaultUpdated || healedCount > 0) {
    vault.timestamp = Date.now();
    vault.createdAt = new Date().toISOString();
    writeJsonSafe(VAULT_FILE, vault);
  }

  if (healedCount > 0) {
    console.log(`[BackupManager] ✅ Auto-Heal Complete: Protected ${healedCount} files from data loss.`);
  }

  return { healed: healedCount, totalFiles: Object.keys(vault.files || {}).length };
}

/**
 * Restores all bot data from a specific snapshot or master vault
 */
function restoreFromSnapshot(snapshotPathOrData = null) {
  let bundle = null;

  if (typeof snapshotPathOrData === "object" && snapshotPathOrData !== null) {
    bundle = snapshotPathOrData;
  } else if (typeof snapshotPathOrData === "string" && fs.existsSync(snapshotPathOrData)) {
    bundle = readJsonSafe(snapshotPathOrData);
  } else {
    bundle = readJsonSafe(VAULT_FILE);
  }

  if (!bundle || !bundle.files) {
    throw new Error("Invalid or unreadable backup snapshot bundle.");
  }

  let restoredCount = 0;

  for (const [filename, fileData] of Object.entries(bundle.files)) {
    const fullPath = path.join(LIB_DIR, filename);
    writeJsonSafe(fullPath, fileData);
    restoredCount++;
  }

  // Update master vault and take a post-restore safeguard snapshot
  createSnapshot("Post-Restore Safeguard");

  return {
    restoredFiles: restoredCount,
    timestamp: bundle.timestamp,
    label: bundle.label,
    createdAt: bundle.createdAt,
  };
}

/**
 * Restores all bot data directly from MongoDB Atlas
 */
async function restoreFromMongo(snapshotId = null) {
  let cloudBundle = null;
  if (snapshotId) {
    const list = await mongoBackup.fetchSnapshotList(50);
    const found = list.find((s) => s.snapshotId === snapshotId || s.snapshotId === `snapshot-${snapshotId}`);
    if (found) {
      cloudBundle = await mongoBackup.SnapshotModel.findOne({ snapshotId: found.snapshotId }).lean();
    }
  }

  if (!cloudBundle) {
    cloudBundle = await mongoBackup.fetchLatestSnapshot();
  }

  if (!cloudBundle || !cloudBundle.files || Object.keys(cloudBundle.files).length === 0) {
    // Fallback: try fetching all granular configs from astrix_configs collection
    const allConfigs = await mongoBackup.fetchAllConfigs();
    if (Object.keys(allConfigs).length > 0) {
      cloudBundle = {
        label: "Granular Cloud Modules",
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        files: allConfigs,
      };
    }
  }

  if (!cloudBundle || !cloudBundle.files) {
    throw new Error("No valid backup found in MongoDB Atlas to restore.");
  }

  return restoreFromSnapshot(cloudBundle);
}

let isShuttingDown = false;

/**
 * Synchronous pre-shutdown handler:
 * Triggered when bot stops or restarts from the panel (SIGINT, SIGTERM, SIGHUP, beforeExit)
 */
function handleShutdown(signal = "SIGNAL") {
  if (isShuttingDown) return;
  isShuttingDown = true;
  try {
    console.log(`[BackupManager] 🛑 Panel ${signal} received. Saving emergency pre-shutdown backup...`);
    createSnapshot(`Panel Stop/Restart (${signal})`);
    console.log(`[BackupManager] ✅ Pre-shutdown backup saved successfully.`);
  } catch (err) {
    console.error(`[BackupManager] Failed saving pre-shutdown backup:`, err.message);
  }
}

/**
 * Initializes backup system:
 * - Runs auto-heal on boot
 * - Hooks panel restart/shutdown signals (NO background interval, zero idle CPU load!)
 */
function init() {
  ensureDirs();

  // 1. Auto-heal on startup
  verifyAndAutoHeal();

  // 2. Pre-shutdown hooks for panel stops and restarts
  process.once("SIGINT", () => handleShutdown("SIGINT"));
  process.once("SIGTERM", () => handleShutdown("SIGTERM"));
  process.once("SIGHUP", () => handleShutdown("SIGHUP"));
  process.once("beforeExit", () => handleShutdown("beforeExit"));
}

module.exports = {
  init,
  handleShutdown,
  verifyAndAutoHeal,
  createSnapshot,
  createSnapshotAsync,
  editSnapshot,
  deleteSnapshot,
  clearAllSnapshots,
  restoreFromSnapshot,
  restoreFromMongo,
  listSnapshots,
  getRealtimeStats,
  getVaultStats: getRealtimeStats,
  mongoBackup,
  getAllTrackedFiles,
  VAULT_FILE,
  SNAPSHOT_DIR,
  TRACKED_FILES,
};
