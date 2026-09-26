const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const noprefixManager = require("../../lib/noprefixManager");
const backupManager = require("../../lib/backupManager");

module.exports = {
  alias: ["backup", "backups", "savevault", "vault"],
  category: "Owner",
  desc: "Master System Backup & Vault — create, restore, list, auto-heal and download bot configuration snapshots.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Only Bot Owners can manage the system backup vault.").catch(() => null);
    }

    const sub = args[0]?.toLowerCase();

    // 1. CREATE SNAPSHOT
    if (sub === "create" || sub === "save") {
      const label = args.slice(1).join(" ") || `Manual Backup by ${message.author.username}`;
      const snapshot = backupManager.createSnapshot(label);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 💾 **Master Backup Snapshot Created**\n` +
            `-# *Timestamp: <t:${Math.floor(snapshot.timestamp / 1000)}:F>*\n\n` +
            `> - **Label:** \`${snapshot.label}\`\n` +
            `> - **Protected Files:** \`${snapshot.stats.totalFiles}\` / ${backupManager.TRACKED_FILES.length} modules\n` +
            `> - **Total Data Records:** \`${snapshot.stats.totalRecords.toLocaleString()}\` settings/entries\n` +
            `> - **Snapshot ID:** \`snapshot-${snapshot.timestamp}\`\n\n` +
            `✅ Master vault synchronized. This data is protected against updates and restarts!`
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# Tip: Use \`.backup export\` to download the backup file to your device.`)
        );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 2. EXPORT / DOWNLOAD BACKUP FILE
    if (sub === "export" || sub === "download" || sub === "dl") {
      const snapshot = backupManager.createSnapshot("Pre-Export Fresh Snapshot");
      if (!fs.existsSync(backupManager.VAULT_FILE)) {
        return message.reply("❌ No vault file found on disk.").catch(() => null);
      }

      const fileBuffer = fs.readFileSync(backupManager.VAULT_FILE);
      const attachment = new AttachmentBuilder(fileBuffer, {
        name: `astrix_backup_${Date.now()}.json`,
        description: "Astrix Master Data Vault Backup",
      });

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📤 **Astrix System Backup Export**\n` +
            `-# *Full consolidated backup of all 30 configuration modules.*\n\n` +
            `> - **Total Modules:** \`${snapshot.stats.totalFiles}\`\n` +
            `> - **Total Records:** \`${snapshot.stats.totalRecords.toLocaleString()}\` configurations\n` +
            `> - **File Size:** \`${(fileBuffer.length / 1024).toFixed(2)} KB\`\n\n` +
            `🛡️ *Save this JSON file on your PC or phone. If you ever switch servers, use \`.backup import\` to restore everything!*`
          )
        );

      return message.reply({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 3. RESTORE FROM SNAPSHOT OR VAULT
    if (sub === "restore" || sub === "load") {
      const targetId = args[1]?.toLowerCase();
      try {
        let result;
        if (!targetId || targetId === "latest" || targetId === "vault") {
          result = backupManager.restoreFromSnapshot();
        } else {
          const snapshots = backupManager.listSnapshots();
          const target = snapshots.find(
            (s) => s.id === targetId || s.id === `snapshot-${targetId}` || s.fileName.includes(targetId)
          );
          if (!target) {
            return message.reply(`❌ Snapshot \`${targetId}\` not found. Use \`.backup list\` to view available snapshots.`).catch(() => null);
          }
          result = backupManager.restoreFromSnapshot(target.filePath);
        }

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🔄 **Backup Restored Successfully**\n` +
              `-# *All server settings & bot states have been restored.*\n\n` +
              `> - **Files Restored:** \`${result.restoredFiles}\` modules\n` +
              `> - **Origin Snapshot:** \`${result.label || "Master Vault"}\`\n` +
              `> - **Snapshot Date:** <t:${Math.floor(result.timestamp / 1000)}:R>\n\n` +
              `✅ Anti-Nuke, Anti-Raid, AutoMod, Welcome, JoinDM, No-Prefix, Roles and all configurations are now active!`
            )
          );

        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return message.reply(`❌ Restoration failed: ${err.message}`).catch(() => null);
      }
    }

    // 4. IMPORT FROM ATTACHMENT
    if (sub === "import" || sub === "upload") {
      let attachment = message.attachments.first();

      // Check if replying to a message with attachment
      if (!attachment && message.reference) {
        try {
          const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
          attachment = repliedMsg?.attachments?.first();
        } catch (_) {}
      }

      if (!attachment || !attachment.name.endsWith(".json")) {
        return message.reply("❌ Please attach a valid `astrix_backup_*.json` file with this command: `.backup import` (or reply to the backup file with `.backup import`).").catch(() => null);
      }

      try {
        const response = await fetch(attachment.url);
        const data = await response.json();

        if (!data || !data.files || typeof data.files !== "object") {
          return message.reply("❌ Invalid backup file format. Expected a valid Astrix backup bundle with a `files` object.").catch(() => null);
        }

        const result = backupManager.restoreFromSnapshot(data);

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 📥 **Backup Imported & Restored**\n` +
              `-# *Successfully applied external backup file.*\n\n` +
              `> - **Modules Restored:** \`${result.restoredFiles}\` files\n` +
              `> - **Backup Label:** \`${data.label || "External Upload"}\`\n` +
              `> - **Source Version:** \`${data.version || "1.0.0"}\`\n\n` +
              `✅ All server configurations have been imported and synchronized with the master vault!`
            )
          );

        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return message.reply(`❌ Failed to parse and import backup file: ${err.message}`).catch(() => null);
      }
    }

    // 5. LIST SNAPSHOTS
    if (sub === "list" || sub === "history") {
      const snapshots = backupManager.listSnapshots();
      if (snapshots.length === 0) {
        return message.reply("ℹ️ No historical snapshots found yet. Run `.backup create` to create one.").catch(() => null);
      }

      let listText = snapshots
        .slice(0, 8)
        .map((s, idx) => {
          const sizeKb = (s.sizeBytes / 1024).toFixed(1);
          return `> \`${idx + 1}.\` **${s.id}**\n> -# Label: *${s.label}* • Files: \`${s.totalFiles}\` • Date: <t:${Math.floor(s.timestamp / 1000)}:R> (\`${sizeKb} KB\`)`;
        })
        .join("\n\n");

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🗄️ **Saved Backup Snapshots**\n` +
            `-# *Showing ${Math.min(8, snapshots.length)} of ${snapshots.length} total stored snapshots.*\n\n` +
            listText +
            `\n\n> **To restore a specific snapshot:** \`.backup restore <snapshot-id>\``
          )
        );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 6. DEFAULT: OVERVIEW & STATUS
    const stats = backupManager.getVaultStats();
    const lastBackupText = stats.vaultTimestamp
      ? `<t:${Math.floor(stats.vaultTimestamp / 1000)}:F> (<t:${Math.floor(stats.vaultTimestamp / 1000)}:R>)`
      : "`Never`";

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛡️ **Astrix Master Data Vault & Backup System**\n` +
          `-# *Continuous anti-wipe protection & state persistence engine.*\n\n` +
          `### 📊 **Vault Health & Coverage**\n` +
          `> - **Master Vault:** ${stats.vaultExists ? "🟢 **HEALTHY & SYNCHRONIZED**" : "🟡 Not initialized"}\n` +
          `> - **Auto-Heal Engine:** 🛡️ **ACTIVE** *(Automatically recovers data if an update wipes files)*\n` +
          `> - **Protected Modules:** \`${stats.activeFilesOnDisk}\` / \`${stats.trackedFilesCount}\` configurations\n` +
          `> - **Total Live Records:** \`${stats.totalDiskRecords.toLocaleString()}\` server entries\n` +
          `> - **Saved Snapshots:** \`${stats.snapshotCount}\` historical versions\n` +
          `> - **Last Backup:** ${lastBackupText}\n\n` +
          `### ⚙️ **Available Commands**\n` +
          `> - \`.backup create [label]\` — Take an instant atomic backup snapshot\n` +
          `> - \`.backup restore [latest|id]\` — Restore all server configurations\n` +
          `> - \`.backup export\` — Download full \`master_vault.json\` file directly in Discord\n` +
          `> - \`.backup import\` — Upload/reply with a backup JSON to restore\n` +
          `> - \`.backup list\` — View all stored historical snapshots`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Auto-Sync runs every 10 mins and before container shutdown. Your data is permanently safe!`
        )
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
