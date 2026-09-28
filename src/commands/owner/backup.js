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
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const noprefixManager = require("../../lib/noprefixManager");
const backupManager = require("../../lib/backupManager");

function buildShortyDashboard(stats, snapshots, selectedSnapshot = null, disabled = false) {
  const container = new ContainerBuilder();

  if (selectedSnapshot) {
    const sizeKb = (selectedSnapshot.sizeBytes / 1024).toFixed(1);
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🗄️ **Snapshot Details: \`${selectedSnapshot.id}\`**\n` +
        `> - **Note / Label:** \`${selectedSnapshot.label}\`\n` +
        `> - **Recorded:** <t:${Math.floor(selectedSnapshot.timestamp / 1000)}:F> (<t:${Math.floor(selectedSnapshot.timestamp / 1000)}:R>)\n` +
        `> - **Modules / Entries:** \`${selectedSnapshot.totalFiles}\` files • \`${selectedSnapshot.totalRecords.toLocaleString()}\` records\n` +
        `> - **File Size:** \`${sizeKb} KB\`\n\n` +
        `*Select an action below to restore, export, or remove this snapshot.*`
      )
    );

    const snapshotActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`backup_act_restore_${selectedSnapshot.id}`)
        .setLabel("Restore")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`backup_act_export_${selectedSnapshot.id}`)
        .setLabel("Export")
        .setEmoji("📤")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`backup_act_delete_${selectedSnapshot.id}`)
        .setLabel("Delete")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("backup_act_back")
        .setLabel("Back")
        .setEmoji("⬅️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled)
    );

    container.addActionRowComponents(snapshotActions);
    return container;
  }

  const lastBackupStr = stats.latestSnapshot
    ? `<t:${Math.floor(stats.latestSnapshot.timestamp / 1000)}:R>`
    : "`None`";

  const uptimeMins = Math.floor(stats.processUptimeSec / 60);
  const uptimeSecs = stats.processUptimeSec % 60;

  const mongoStatus = stats.mongo || { connected: false };
  const mongoText = mongoStatus.connected
    ? `🟢 **Connected** (\`${mongoStatus.host || "alone.g42tkzg.mongodb.net"}\`)`
    : `🟡 **Connecting / Ready**`;

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `### 🛡️ **Astrix Master Data Vault & Live Backup**\n` +
      `-# *Zero-overhead state protection with auto pre-shutdown snapshot engine.*\n\n` +
      `> 📊 **Live Records:** \`${stats.totalDiskRecords.toLocaleString()}\` active configurations\n` +
      `> 📁 **Protected Files:** \`${stats.activeFilesOnDisk}\` / \`${stats.trackedFilesCount}\` modules (\`${(stats.totalDiskBytes / 1024).toFixed(1)} KB\`)\n` +
      `> ☁️ **Cloud Database:** ${mongoText}\n` +
      `> ⚡ **Live RAM / Uptime:** \`${stats.ramUsageMb} MB\` • \`${uptimeMins}m ${uptimeSecs}s\`\n` +
      `> 🗄️ **Saved Snapshots:** \`${stats.snapshotCount}\` versions • Latest: ${lastBackupStr}\n` +
      `> 🛑 **Panel Shutdown Hook:** 🟢 **Active** *(Auto-saves when panel stops/restarts)*\n` +
      `> 🛡️ **Auto-Heal Engine:** 🟢 **Active** *(Auto-restores data if files wiped)*`
    )
  );

  // Dropdown for selecting snapshot (if snapshots exist)
  if (snapshots.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("backup_select_snapshot")
      .setPlaceholder("Select a snapshot to inspect / restore / delete...")
      .setDisabled(disabled);

    const displaySnapshots = snapshots.slice(0, 25);
    for (const snap of displaySnapshots) {
      const snapLabel = (snap.label || "Snapshot").slice(0, 50);
      const dateStr = new Date(snap.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(snapLabel)
          .setDescription(`${snap.id} • ${dateStr} • ${(snap.sizeBytes / 1024).toFixed(1)} KB`)
          .setValue(snap.id)
          .setEmoji("💾")
      );
    }

    container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
  }

  // Action Buttons Row (up to 5 buttons)
  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("backup_btn_create")
      .setLabel("Create")
      .setEmoji("💾")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_btn_cloudsync")
      .setLabel("Cloud Sync")
      .setEmoji("☁️")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_btn_export")
      .setLabel("Export")
      .setEmoji("📤")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_btn_refresh")
      .setLabel("Refresh")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_btn_clear")
      .setLabel("Clear All")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled || snapshots.length === 0)
  );

  container.addActionRowComponents(btnRow);
  return container;
}

module.exports = {
  alias: ["backup", "backups", "savevault", "vault"],
  category: "Owner",
  desc: "Master System Backup & Vault — create, edit, delete, clear, import, export and live real-time monitoring.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Only Bot Owners can manage the system backup vault.").catch(() => null);
    }

    const sub = args[0]?.toLowerCase();

    // 1. CREATE SNAPSHOT / CLOUD SYNC
    if (sub === "create" || sub === "save" || sub === "sync" || sub === "cloud") {
      const isCloudPull = args[1]?.toLowerCase() === "restore" || args[1]?.toLowerCase() === "pull";
      if (isCloudPull) {
        try {
          const res = await backupManager.restoreFromMongo();
          const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### ☁️ **Cloud Restore Completed**\n` +
              `> - **Modules Restored:** \`${res.restoredFiles}\` files\n` +
              `> - **Source Label:** \`${res.label || "MongoDB Cloud"}\`\n` +
              `> - **Snapshot Date:** <t:${Math.floor(res.timestamp / 1000)}:R>\n\n` +
              `✅ All bot configurations pulled live from MongoDB Atlas and restored!`
            )
          );
          return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        } catch (err) {
          return message.reply(`❌ Cloud restore failed: ${err.message}`).catch(() => null);
        }
      }

      const label = args.slice(1).join(" ") || `Manual Backup by ${message.author.username}`;
      const { snapshot, cloudSuccess } = await backupManager.createSnapshotAsync(label);
      const cloudStatusText = cloudSuccess ? "🟢 **Synced to MongoDB Atlas**" : "🟡 **Saved locally (Cloud pending)**";

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 💾 **Snapshot Created & Backed Up**\n` +
          `> - **Label:** \`${snapshot.label}\`\n` +
          `> - **ID:** \`snapshot-${snapshot.timestamp}\`\n` +
          `> - **Data:** \`${snapshot.stats.totalFiles}\` modules • \`${snapshot.stats.totalRecords.toLocaleString()}\` records\n` +
          `> - **Cloud Backup:** ${cloudStatusText}\n` +
          `> - **Database:** \`Astrix\` (Cluster: \`alone.g42tkzg.mongodb.net\`)\n` +
          `> - **Saved At:** <t:${Math.floor(snapshot.timestamp / 1000)}:R>\n\n` +
          `✅ AntiNuke, Welcome, AutoMod, Triggers, Custom Roles, Leveling & all settings protected!`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 2. EDIT SNAPSHOT LABEL
    if (sub === "edit" || sub === "rename") {
      const targetId = args[1];
      const newLabel = args.slice(2).join(" ");
      if (!targetId || !newLabel) {
        return message.reply("⚠️ Usage: `.backup edit <snapshot-id> <new label>`").catch(() => null);
      }

      try {
        const edited = backupManager.editSnapshot(targetId, newLabel);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✏️ **Snapshot Label Updated**\n` +
            `> - **ID:** \`${edited.id}\`\n` +
            `> - **New Label:** \`${edited.label}\`\n\n` +
            `✅ Successfully updated snapshot metadata.`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return message.reply(`❌ Failed to edit snapshot: ${err.message}`).catch(() => null);
      }
    }

    // 3. DELETE SPECIFIC SNAPSHOT
    if (sub === "delete" || sub === "del" || sub === "remove") {
      const targetId = args[1];
      if (!targetId) {
        return message.reply("⚠️ Usage: `.backup delete <snapshot-id>`").catch(() => null);
      }

      try {
        const deleted = backupManager.deleteSnapshot(targetId);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🗑️ **Snapshot Deleted**\n` +
            `> - **ID:** \`${deleted.id}\`\n` +
            `> - **Label:** \`${deleted.label}\`\n\n` +
            `✅ Snapshot file permanently removed from disk.`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return message.reply(`❌ Failed to delete snapshot: ${err.message}`).catch(() => null);
      }
    }

    // 4. CLEAR ALL SNAPSHOTS
    if (sub === "clear" || sub === "clearall") {
      const isConfirm = args[1]?.toLowerCase() === "confirm" || args[1]?.toLowerCase() === "all";
      if (!isConfirm) {
        return message.reply("⚠️ To confirm deleting ALL stored snapshots, run: `.backup clear confirm`").catch(() => null);
      }

      const result = backupManager.clearAllSnapshots();
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧹 **All Snapshots Cleared**\n` +
          `> - **Deleted Snapshots:** \`${result.deletedCount}\` files\n\n` +
          `✅ Historical snapshots cleaned. Master Vault remains intact for auto-heal!`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 5. EXPORT / DOWNLOAD BACKUP FILE
    if (sub === "export" || sub === "download" || sub === "dl") {
      const targetId = args[1];
      let filePath = backupManager.VAULT_FILE;
      let exportLabel = "Master Vault";

      if (targetId) {
        const snapshots = backupManager.listSnapshots();
        const target = snapshots.find(
          (s) => s.id === targetId || s.id === `snapshot-${targetId}` || s.fileName.includes(targetId)
        );
        if (!target) {
          return message.reply(`❌ Snapshot \`${targetId}\` not found.`).catch(() => null);
        }
        filePath = target.filePath;
        exportLabel = target.label;
      } else {
        backupManager.createSnapshot("Pre-Export Fresh Snapshot");
      }

      if (!fs.existsSync(filePath)) {
        return message.reply("❌ No backup file found on disk.").catch(() => null);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const attachment = new AttachmentBuilder(fileBuffer, {
        name: `astrix_backup_${Date.now()}.json`,
        description: "Astrix Data Vault Backup",
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📤 **Astrix Backup Export**\n` +
          `> - **Source:** \`${exportLabel}\`\n` +
          `> - **File Size:** \`${(fileBuffer.length / 1024).toFixed(2)} KB\`\n\n` +
          `🛡️ *Save this JSON file safely. Use \`.backup import\` to restore anytime!*`
        )
      );

      return message.reply({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 6. RESTORE
    if (sub === "restore" || sub === "load") {
      const targetId = args[1]?.toLowerCase();
      try {
        let result;
        if (targetId === "cloud" || targetId === "mongo" || targetId === "atlas") {
          result = await backupManager.restoreFromMongo();
        } else if (!targetId || targetId === "latest" || targetId === "vault") {
          result = backupManager.restoreFromSnapshot();
        } else {
          const snapshots = backupManager.listSnapshots();
          const target = snapshots.find(
            (s) => s.id === targetId || s.id === `snapshot-${targetId}` || s.fileName.includes(targetId)
          );
          if (!target) {
            // Check if it's a cloud snapshot id
            try {
              result = await backupManager.restoreFromMongo(targetId);
            } catch (_) {
              return message.reply(`❌ Snapshot \`${targetId}\` not found on disk or cloud. Use \`.backup list\` to view available snapshots.`).catch(() => null);
            }
          } else {
            result = backupManager.restoreFromSnapshot(target.filePath);
          }
        }

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔄 **Backup Restored Successfully**\n` +
            `> - **Modules Restored:** \`${result.restoredFiles}\` files\n` +
            `> - **Source Label:** \`${result.label || "Master Vault"}\`\n` +
            `> - **Snapshot Date:** <t:${Math.floor(result.timestamp / 1000)}:R>\n\n` +
            `✅ All server configurations, anti-nuke, automod, roles and settings are active!`
          )
        );

        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return message.reply(`❌ Restoration failed: ${err.message}`).catch(() => null);
      }
    }

    // 7. IMPORT
    if (sub === "import" || sub === "upload") {
      let attachment = message.attachments.first();
      if (!attachment && message.reference) {
        try {
          const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
          attachment = repliedMsg?.attachments?.first();
        } catch (_) {}
      }

      if (!attachment || !attachment.name.endsWith(".json")) {
        return message.reply("❌ Please attach or reply to a valid `astrix_backup_*.json` file with `.backup import`.").catch(() => null);
      }

      try {
        const response = await fetch(attachment.url);
        const data = await response.json();

        if (!data || !data.files || typeof data.files !== "object") {
          return message.reply("❌ Invalid backup file format. Expected a valid Astrix backup bundle.").catch(() => null);
        }

        const result = backupManager.restoreFromSnapshot(data);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📥 **Backup Imported & Restored**\n` +
            `> - **Modules Restored:** \`${result.restoredFiles}\` files\n` +
            `> - **Label:** \`${data.label || "External Upload"}\`\n` +
            `> - **Timestamp:** <t:${Math.floor(result.timestamp / 1000)}:R>\n\n` +
            `✅ Imported configuration is now synchronized and live!`
          )
        );

        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return message.reply(`❌ Failed to parse and import backup file: ${err.message}`).catch(() => null);
      }
    }

    // 8. LIST COMMAND
    if (sub === "list" || sub === "history") {
      const snapshots = backupManager.listSnapshots();
      if (snapshots.length === 0) {
        return message.reply("ℹ️ No historical snapshots found yet. Run `.backup create` to create one.").catch(() => null);
      }

      let listText = snapshots
        .slice(0, 10)
        .map((s, idx) => {
          const sizeKb = (s.sizeBytes / 1024).toFixed(1);
          return `> \`${idx + 1}.\` **${s.id}** — *${s.label}*\n> -# <t:${Math.floor(s.timestamp / 1000)}:R> • \`${s.totalFiles}\` files • \`${s.totalRecords}\` records • \`${sizeKb} KB\``;
        })
        .join("\n\n");

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🗄️ **Saved Backup Snapshots (${snapshots.length})**\n\n` +
          listText +
          `\n\n-# Quick Actions: \`.backup restore <id>\` • \`.backup delete <id>\` • \`.backup edit <id> <label>\``
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 9. DEFAULT SHORTY UI WITH BUTTONS & DROPDOWN (Interactive)
    let stats = backupManager.getRealtimeStats();
    let snapshots = backupManager.listSnapshots();
    let selectedSnapshot = null;

    const initialContainer = buildShortyDashboard(stats, snapshots, selectedSnapshot, false);

    const replyMsg = await message.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const collector = replyMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      try {
        const customId = i.customId;

        // Dropdown selection
        if (customId === "backup_select_snapshot") {
          await i.deferUpdate();
          const targetId = i.values[0];
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = snapshots.find((s) => s.id === targetId) || null;
          const updated = buildShortyDashboard(stats, snapshots, selectedSnapshot, false);
          return i.editReply({ components: [updated] });
        }

        // Back to main overview
        if (customId === "backup_act_back") {
          await i.deferUpdate();
          selectedSnapshot = null;
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          return i.editReply({ components: [updated] });
        }

        // Action: Restore selected snapshot
        if (customId.startsWith("backup_act_restore_")) {
          await i.deferUpdate();
          const targetId = customId.replace("backup_act_restore_", "");
          const target = snapshots.find((s) => s.id === targetId);
          if (target) {
            backupManager.restoreFromSnapshot(target.filePath);
          }
          selectedSnapshot = null;
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          return i.followUp({ content: `✅ Snapshot \`${targetId}\` restored successfully!`, flags: MessageFlags.Ephemeral });
        }

        // Action: Export selected snapshot
        if (customId.startsWith("backup_act_export_")) {
          const targetId = customId.replace("backup_act_export_", "");
          const target = snapshots.find((s) => s.id === targetId);
          if (target && fs.existsSync(target.filePath)) {
            const buf = fs.readFileSync(target.filePath);
            const att = new AttachmentBuilder(buf, { name: `${target.id}.json` });
            return i.reply({
              content: `📤 Here is the exported file for \`${target.id}\`:`,
              files: [att],
              flags: MessageFlags.Ephemeral,
            });
          }
          return i.reply({ content: "❌ Target snapshot file missing.", flags: MessageFlags.Ephemeral });
        }

        // Action: Delete selected snapshot
        if (customId.startsWith("backup_act_delete_")) {
          await i.deferUpdate();
          const targetId = customId.replace("backup_act_delete_", "");
          try {
            backupManager.deleteSnapshot(targetId);
          } catch (_) {}
          selectedSnapshot = null;
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          await i.editReply({ components: [updated] });
          return i.followUp({ content: `🗑️ Snapshot \`${targetId}\` deleted.`, flags: MessageFlags.Ephemeral });
        }

        // Button: Create snapshot
        if (customId === "backup_btn_create") {
          await i.deferUpdate();
          backupManager.createSnapshot(`Manual Snapshot (${message.author.username})`);
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = null;
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          await i.editReply({ components: [updated] });
          return i.followUp({ content: `💾 New backup snapshot created successfully!`, flags: MessageFlags.Ephemeral });
        }

        // Button: Cloud Sync
        if (customId === "backup_btn_cloudsync") {
          await i.deferUpdate();
          const { snapshot, cloudSuccess } = await backupManager.createSnapshotAsync(`Cloud Sync (${message.author.username})`);
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = null;
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          await i.editReply({ components: [updated] });
          const statusText = cloudSuccess ? "🟢 Uploaded cleanly to MongoDB Atlas!" : "⚠️ Saved locally, cloud sync pending.";
          return i.followUp({
            content: `☁️ **Cloud Synchronization:** ${statusText}\nBacked up **${stats.trackedFilesCount}** modules into MongoDB cluster.`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // Button: Export Master Vault
        if (customId === "backup_btn_export") {
          backupManager.createSnapshot("Pre-Export Fresh Snapshot");
          if (!fs.existsSync(backupManager.VAULT_FILE)) {
            return i.reply({ content: "❌ No vault file found on disk.", flags: MessageFlags.Ephemeral });
          }
          const buf = fs.readFileSync(backupManager.VAULT_FILE);
          const att = new AttachmentBuilder(buf, { name: `astrix_backup_${Date.now()}.json` });
          return i.reply({
            content: `📤 **Master Data Vault Export:**`,
            files: [att],
            flags: MessageFlags.Ephemeral,
          });
        }

        // Button: Refresh stats
        if (customId === "backup_btn_refresh") {
          await i.deferUpdate();
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = null;
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          return i.editReply({ components: [updated] });
        }

        // Button: Clear All snapshots
        if (customId === "backup_btn_clear") {
          await i.deferUpdate();
          const res = backupManager.clearAllSnapshots();
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = null;
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          await i.editReply({ components: [updated] });
          return i.followUp({ content: `🧹 Cleared \`${res.deletedCount}\` historical snapshots!`, flags: MessageFlags.Ephemeral });
        }
      } catch (err) {
        console.error("[BackupCommand] Interaction error:", err);
      }
    });

    collector.on("end", async () => {
      try {
        const finalContainer = buildShortyDashboard(stats, snapshots, selectedSnapshot, true);
        await replyMsg.edit({ components: [finalContainer] }).catch(() => null);
      } catch (_) {}
    });
  },
};
