const fs = require("fs");
const path = require("path");

const LIB_DIR = path.resolve(__dirname);
const ROOT_DIR = path.resolve(__dirname, "../..");
const BACKUP_DIR = path.join(ROOT_DIR, "backups");
const SNAPSHOT_DIR = path.join(BACKUP_DIR, "snapshots");
const VAULT_FILE = path.join(BACKUP_DIR, "master_vault.json");

const TRACKED_FILES = [
  "antinukeConfig.json",
  "antiraidConfig.json",
  "automodConfig.json",
  "welcomeConfig.json",
  "goodbyeConfig.json",
  "noprefixConfig.json",
  "nukeConfig.json",
  "customRolesConfig.json",
  "customRolesData.json",
  "serverConfig.json",
  "configManagerConfig.json",
  "giveaways.json",
  "guildPrefixes.json",
  "guildPresets.json",
  "j2cConfig.json",
  "levelingConfig.json",
  "levelingData.json",
  "loggingConfig.json",
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
];

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
    // If it has standard collections like noprefix
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
    console.error(`[BackupManager] Failed writing ${filePath}:`, err.message);
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
function createSnapshot(label = "Auto Backup") {
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

  for (const filename of TRACKED_FILES) {
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

  // 3. Keep latest 10 snapshots, prune older
  pruneOldSnapshots(10);

  return bundle;
}

/**
 * Deletes older snapshots exceeding maxKeep count
 */
function pruneOldSnapshots(maxKeep = 10) {
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
 * AUTO-HEAL ON STARTUP:
 * Compares files on disk vs master vault.
 * If any file on disk was wiped or replaced with blank/empty values by a code update or git pull,
 * it restores the full data immediately from the vault!
 */
function verifyAndAutoHeal() {
  ensureDirs();
  const vault = readJsonSafe(VAULT_FILE);

  if (!vault || !vault.files) {
    // No prior vault found on disk; create the initial snapshot right now
    createSnapshot("Initial Master Vault Baseline");
    console.log("[BackupManager] 📦 Initialized Master Vault baseline from current files.");
    return { healed: 0, preserved: 0 };
  }

  let healedCount = 0;
  let vaultUpdated = false;

  for (const filename of TRACKED_FILES) {
    const fullPath = path.join(LIB_DIR, filename);
    const diskData = readJsonSafe(fullPath);
    const vaultData = vault.files[filename];

    const diskRecords = countRecords(diskData);
    const vaultRecords = countRecords(vaultData);

    // Case 1: Disk file was wiped out or truncated to empty ({}) while vault has real data!
    if (vaultData && (!diskData || (diskRecords === 0 && vaultRecords > 0) || (diskRecords < vaultRecords && diskRecords <= 1 && vaultRecords >= 2))) {
      writeJsonSafe(fullPath, vaultData);
      healedCount++;
      console.log(
        `[BackupManager] 🛡️ AUTO-HEAL RESTORE: "${filename}" was recovered from vault (${vaultRecords} records restored after update)!`
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
    if (TRACKED_FILES.includes(filename)) {
      const fullPath = path.join(LIB_DIR, filename);
      writeJsonSafe(fullPath, fileData);
      restoredCount++;
    }
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
 * Returns latest vault statistics
 */
function getVaultStats() {
  ensureDirs();
  const vault = readJsonSafe(VAULT_FILE);
  const snapshots = listSnapshots();

  let totalDiskRecords = 0;
  let activeFiles = 0;

  for (const f of TRACKED_FILES) {
    const fullPath = path.join(LIB_DIR, f);
    const data = readJsonSafe(fullPath);
    if (data) {
      activeFiles++;
      totalDiskRecords += countRecords(data);
    }
  }

  return {
    vaultExists: Boolean(vault),
    vaultTimestamp: vault?.timestamp || null,
    vaultCreatedAt: vault?.createdAt || null,
    vaultRecords: vault?.stats?.totalRecords || 0,
    trackedFilesCount: TRACKED_FILES.length,
    activeFilesOnDisk: activeFiles,
    totalDiskRecords,
    snapshotCount: snapshots.length,
    latestSnapshot: snapshots[0] || null,
  };
}

let syncInterval = null;

/**
 * Initializes auto-heal, shutdown hooks, and periodic 10-minute snapshot sync
 */
function init() {
  ensureDirs();

  // 1. Run auto-heal immediately before bot shards boot up
  verifyAndAutoHeal();

  // 2. Schedule periodic auto-sync every 10 minutes
  if (!syncInterval) {
    syncInterval = setInterval(() => {
      try {
        createSnapshot("Auto Periodic 10-Min Sync");
      } catch (e) {
        console.error("[BackupManager] Periodic sync failed:", e.message);
      }
    }, 10 * 60 * 1000);

    if (syncInterval.unref) syncInterval.unref();
  }

  // 3. Graceful shutdown handler to persist last state
  const handleExit = () => {
    try {
      createSnapshot("Process Shutdown Safeguard");
    } catch (_) {}
  };

  process.once("SIGINT", handleExit);
  process.once("SIGTERM", handleExit);
}

module.exports = {
  init,
  verifyAndAutoHeal,
  createSnapshot,
  restoreFromSnapshot,
  listSnapshots,
  getVaultStats,
  VAULT_FILE,
  TRACKED_FILES,
};
