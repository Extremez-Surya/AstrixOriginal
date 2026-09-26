const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
const noprefixManager = require("../../lib/noprefixManager");
const backupManager = require("../../lib/backupManager");

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
      description: "View Master Vault health and backup status.",
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
      name: "export",
      description: "Download the complete backup JSON file to your device.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "restore",
      description: "Restore all server configurations from master vault or snapshot.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "snapshot_id",
          description: "Snapshot ID to restore from (default: latest vault).",
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
          new TextDisplayBuilder().setContent(`-# Tip: Use \`/backup export\` to download the backup file to your device.`)
        );

      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 2. EXPORT / DOWNLOAD
    if (subcommand === "export") {
      const snapshot = backupManager.createSnapshot("Pre-Export Fresh Snapshot");
      if (!fs.existsSync(backupManager.VAULT_FILE)) {
        return interaction.reply({ content: "❌ No vault file found on disk.", flags: MessageFlags.Ephemeral }).catch(() => null);
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

      return interaction.reply({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 3. RESTORE
    if (subcommand === "restore") {
      const targetId = interaction.options.getString("snapshot_id")?.toLowerCase();
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
            return interaction.reply({ content: `❌ Snapshot \`${targetId}\` not found. Use \`/backup list\` to view available snapshots.`, flags: MessageFlags.Ephemeral }).catch(() => null);
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

        return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      } catch (err) {
        return interaction.reply({ content: `❌ Restoration failed: ${err.message}`, flags: MessageFlags.Ephemeral }).catch(() => null);
      }
    }

    // 4. LIST
    if (subcommand === "list") {
      const snapshots = backupManager.listSnapshots();
      if (snapshots.length === 0) {
        return interaction.reply({ content: "ℹ️ No historical snapshots found yet. Run `/backup create` to create one.", flags: MessageFlags.Ephemeral }).catch(() => null);
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
            `\n\n> **To restore a specific snapshot:** \`/backup restore snapshot_id:<id>\``
          )
        );

      return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // 5. STATUS
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
          `> - \`/backup create [label]\` — Take an instant atomic backup snapshot\n` +
          `> - \`/backup restore [snapshot_id]\` — Restore all server configurations\n` +
          `> - \`/backup export\` — Download full \`master_vault.json\` file directly in Discord\n` +
          `> - \`/backup list\` — View all stored historical snapshots`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# Auto-Sync runs every 10 mins and before container shutdown. Your data is permanently safe!`
        )
      );

    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
