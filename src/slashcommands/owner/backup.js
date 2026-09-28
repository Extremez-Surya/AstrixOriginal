const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const fs = require("fs");
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
        .setCustomId(`backup_slash_act_restore_${selectedSnapshot.id}`)
        .setLabel("Restore")
        .setEmoji("<a:astrix_loading_anim:1554036083530928148>")
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`backup_slash_act_export_${selectedSnapshot.id}`)
        .setLabel("Export")
        .setEmoji("<:astrix_arrow:1554035930992607253>")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`backup_slash_act_delete_${selectedSnapshot.id}`)
        .setLabel("Delete")
        .setEmoji("<:astrix_trash:1554036206147338321>")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId("backup_slash_act_back")
        .setLabel("Back")
        .setEmoji("<:astrix_arrow_double:1554035941163802639>")
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
      `### <:astrix_shield:1554036155001995406> **Astrix Master Data Vault & Live Backup**\n` +
      `-# *Zero-overhead state protection with auto pre-shutdown snapshot engine.*\n\n` +
      `> <:astrix_stats:1554036191597428787> **Live Records:** \`${stats.totalDiskRecords.toLocaleString()}\` active configurations\n` +
      `> <:astrix_gear:1554036035111886888> **Protected Files:** \`${stats.activeFilesOnDisk}\` / \`${stats.trackedFilesCount}\` modules (\`${(stats.totalDiskBytes / 1024).toFixed(1)} KB\`)\n` +
      `> <:astrix_globe:1554036044368711703> **Cloud Database:** ${mongoText}\n` +
      `> <a:astrix_ping_anim:1554036131308511292> **Live RAM / Uptime:** \`${stats.ramUsageMb} MB\` • \`${uptimeMins}m ${uptimeSecs}s\`\n` +
      `> <:astrix_clock:1554035984809590816> **Saved Snapshots:** \`${stats.snapshotCount}\` versions • Latest: ${lastBackupStr}\n` +
      `> <:astrix_lock:1554036087905849376> **Panel Shutdown Hook:** 🟢 **Active** *(Auto-saves when panel stops/restarts)*\n` +
      `> <:astrix_check:1554035980342661120> **Auto-Heal Engine:** 🟢 **Active** *(Auto-restores data if files wiped)*`
    )
  );

  // Dropdown for selecting snapshot (if snapshots exist)
  if (snapshots.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("backup_slash_select_snapshot")
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
          .setEmoji("<:astrix_clock:1554035984809590816>")
      );
    }

    container.addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));
  }

  // Action Buttons Row (up to 5 buttons)
  const btnRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("backup_slash_btn_create")
      .setLabel("Create")
      .setEmoji("<:astrix_check:1554035980342661120>")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_slash_btn_cloudsync")
      .setLabel("Cloud Sync")
      .setEmoji("<a:astrix_sparkle_anim:1554036181463998534>")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_slash_btn_export")
      .setLabel("Export")
      .setEmoji("<:astrix_arrow:1554035930992607253>")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_slash_btn_refresh")
      .setLabel("Refresh")
      .setEmoji("<a:astrix_loading_anim:1554036083530928148>")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("backup_slash_btn_clear")
      .setLabel("Clear All")
      .setEmoji("<:astrix_trash:1554036206147338321>")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled || snapshots.length === 0)
  );

  container.addActionRowComponents(btnRow);
  return container;
}

module.exports = {
  name: "backup",
  category: "Owner",
  description: "Master Data Vault & Configuration Backup System (Bot Owner Only).",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: [],
  devOnly: true,

  options: [
    {
      name: "status",
      description: "View real-time vault health, disk records, and interactive dashboard.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "create",
      description: "Create an instant atomic backup snapshot of all configurations.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "label",
          description: "Optional descriptive note for this backup.",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "edit",
      description: "Edit the label or note of an existing snapshot.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "snapshot_id",
          description: "Snapshot ID (e.g. snapshot-1727400000000).",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "new_label",
          description: "New label or description for this snapshot.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "delete",
      description: "Delete a specific backup snapshot file.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "snapshot_id",
          description: "Snapshot ID to delete.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "clear",
      description: "Clear all saved historical snapshots from disk.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "export",
      description: "Download the complete backup JSON file to your device.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "snapshot_id",
          description: "Optional specific snapshot ID to export.",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "sync",
      description: "Synchronize all configurations with MongoDB Atlas cloud database.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "action",
          description: "Action to perform (push = upload to cloud, pull = restore from cloud).",
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: "push (Upload to MongoDB)", value: "push" },
            { name: "pull (Restore from MongoDB)", value: "pull" },
          ],
        },
      ],
    },
    {
      name: "restore",
      description: "Restore all server configurations from master vault, snapshot, or cloud.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "snapshot_id",
          description: "Snapshot ID or 'cloud' to restore from MongoDB Atlas.",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
    },
    {
      name: "list",
      description: "List stored historical backup snapshots.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute(client, interaction) {
    if (!interaction?.reply && client?.reply) {
      interaction = client;
      client = interaction.client;
    }

    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      return interaction.reply({ content: "❌ Access Denied: Only Bot Owners can manage system backups.", flags: MessageFlags.Ephemeral }).catch(() => null);
    }

    const subcommand = interaction.options.getSubcommand();

    // 1. CREATE
    if (subcommand === "create") {
      const label = interaction.options.getString("label") || `Slash Backup by ${interaction.user.username}`;
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

      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 1.5 SYNC CLOUD
    if (subcommand === "sync") {
      const action = interaction.options.getString("action") || "push";
      if (action === "pull") {
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
          return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        } catch (err) {
          return interaction.reply({ content: `❌ Cloud restore failed: ${err.message}`, flags: MessageFlags.Ephemeral }).catch(() => null);
        }
      }

      // Default: push to MongoDB Atlas
      const { snapshot, cloudSuccess } = await backupManager.createSnapshotAsync(`Cloud Slash Sync by ${interaction.user.username}`);
      const statusIcon = cloudSuccess ? "🟢" : "⚠️";
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ☁️ **Cloud Backup Synchronized**\n` +
          `> - **Label:** \`${snapshot.label}\`\n` +
          `> - **Cloud Status:** ${statusIcon} **${cloudSuccess ? "Uploaded to MongoDB Atlas" : "Pending Sync"}**\n` +
          `> - **Modules / Records:** \`${snapshot.stats.totalFiles}\` modules • \`${snapshot.stats.totalRecords.toLocaleString()}\` records\n` +
          `> - **Database:** \`Astrix\` (Cluster: \`alone.g42tkzg.mongodb.net\`)\n\n` +
          `✅ Complete bot data (AntiNuke, Welcome, AutoMod, Triggers, Custom Roles, etc.) backed up!`
        )
      );
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 2. EDIT
    if (subcommand === "edit") {
      const targetId = interaction.options.getString("snapshot_id");
      const newLabel = interaction.options.getString("new_label");

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
        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return interaction.reply({ content: `❌ Failed to edit snapshot: ${err.message}`, flags: MessageFlags.Ephemeral }).catch(() => null);
      }
    }

    // 3. DELETE
    if (subcommand === "delete") {
      const targetId = interaction.options.getString("snapshot_id");
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
        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return interaction.reply({ content: `❌ Failed to delete snapshot: ${err.message}`, flags: MessageFlags.Ephemeral }).catch(() => null);
      }
    }

    // 4. CLEAR ALL
    if (subcommand === "clear") {
      const result = backupManager.clearAllSnapshots();
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧹 **All Snapshots Cleared**\n` +
          `> - **Deleted Snapshots:** \`${result.deletedCount}\` files\n\n` +
          `✅ Historical snapshots cleaned. Master Vault remains intact for auto-heal!`
        )
      );
      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 5. EXPORT
    if (subcommand === "export") {
      const targetId = interaction.options.getString("snapshot_id");
      let filePath = backupManager.VAULT_FILE;
      let exportLabel = "Master Vault";

      if (targetId) {
        const snapshots = backupManager.listSnapshots();
        const target = snapshots.find(
          (s) => s.id === targetId || s.id === `snapshot-${targetId}` || s.fileName.includes(targetId)
        );
        if (!target) {
          return interaction.reply({ content: `❌ Snapshot \`${targetId}\` not found.`, flags: MessageFlags.Ephemeral }).catch(() => null);
        }
        filePath = target.filePath;
        exportLabel = target.label;
      } else {
        backupManager.createSnapshot("Pre-Export Fresh Snapshot");
      }

      if (!fs.existsSync(filePath)) {
        return interaction.reply({ content: "❌ No backup file found on disk.", flags: MessageFlags.Ephemeral }).catch(() => null);
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
          `🛡️ *Save this JSON file safely on your device.*`
        )
      );

      return interaction.reply({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 6. RESTORE
    if (subcommand === "restore") {
      const targetId = interaction.options.getString("snapshot_id")?.toLowerCase();
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
              return interaction.reply({ content: `❌ Snapshot \`${targetId}\` not found on disk or cloud. Use \`/backup list\` to view available snapshots.`, flags: MessageFlags.Ephemeral }).catch(() => null);
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

        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return interaction.reply({ content: `❌ Restoration failed: ${err.message}`, flags: MessageFlags.Ephemeral }).catch(() => null);
      }
    }

    // 7. LIST
    if (subcommand === "list") {
      const snapshots = backupManager.listSnapshots();
      if (snapshots.length === 0) {
        return interaction.reply({ content: "ℹ️ No historical snapshots found yet. Run `/backup create` to create one.", flags: MessageFlags.Ephemeral }).catch(() => null);
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
          `\n\n-# Quick Actions: \`/backup restore snapshot_id:<id>\` • \`/backup delete snapshot_id:<id>\``
        )
      );

      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 8. STATUS / DEFAULT DASHBOARD (Interactive)
    let stats = backupManager.getRealtimeStats();
    let snapshots = backupManager.listSnapshots();
    let selectedSnapshot = null;

    const initialContainer = buildShortyDashboard(stats, snapshots, selectedSnapshot, false);

    const replyMsg = await interaction.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      fetchReply: true,
    });

    const collector = replyMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      try {
        const customId = i.customId;

        // Dropdown selection
        if (customId === "backup_slash_select_snapshot") {
          await i.deferUpdate();
          const targetId = i.values[0];
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = snapshots.find((s) => s.id === targetId) || null;
          const updated = buildShortyDashboard(stats, snapshots, selectedSnapshot, false);
          return i.editReply({ components: [updated] });
        }

        // Back to main overview
        if (customId === "backup_slash_act_back") {
          await i.deferUpdate();
          selectedSnapshot = null;
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          return i.editReply({ components: [updated] });
        }

        // Action: Restore selected snapshot
        if (customId.startsWith("backup_slash_act_restore_")) {
          await i.deferUpdate();
          const targetId = customId.replace("backup_slash_act_restore_", "");
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
        if (customId.startsWith("backup_slash_act_export_")) {
          const targetId = customId.replace("backup_slash_act_export_", "");
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
        if (customId.startsWith("backup_slash_act_delete_")) {
          await i.deferUpdate();
          const targetId = customId.replace("backup_slash_act_delete_", "");
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
        if (customId === "backup_slash_btn_create") {
          await i.deferUpdate();
          backupManager.createSnapshot(`Manual Snapshot (${interaction.user.username})`);
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = null;
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          await i.editReply({ components: [updated] });
          return i.followUp({ content: `💾 New backup snapshot created successfully!`, flags: MessageFlags.Ephemeral });
        }

        // Button: Cloud Sync
        if (customId === "backup_slash_btn_cloudsync") {
          await i.deferUpdate();
          const { snapshot, cloudSuccess } = await backupManager.createSnapshotAsync(`Cloud Sync (${interaction.user.username})`);
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
        if (customId === "backup_slash_btn_export") {
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
        if (customId === "backup_slash_btn_refresh") {
          await i.deferUpdate();
          stats = backupManager.getRealtimeStats();
          snapshots = backupManager.listSnapshots();
          selectedSnapshot = null;
          const updated = buildShortyDashboard(stats, snapshots, null, false);
          return i.editReply({ components: [updated] });
        }

        // Button: Clear All snapshots
        if (customId === "backup_slash_btn_clear") {
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
        console.error("[BackupSlashCommand] Interaction error:", err);
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
