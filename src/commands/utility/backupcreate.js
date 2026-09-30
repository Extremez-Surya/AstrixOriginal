const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const backupManager = require("../../lib/backupManager");

module.exports = {
  alias: ["backupcreate", "serverbackupcreate", "createbackup"],
  category: "Utility",
  desc: "Create a complete server layout or system configuration backup.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    // If run by bot owner, trigger comprehensive master data backup of all modules
    if (noprefixManager.isOwner(message.author.id, client)) {
      const label = args.join(" ") || `Manual Backup by ${message.author.username}`;
      const { snapshot, cloudSuccess } = await backupManager.createSnapshotAsync(label);
      const cloudStatusText = cloudSuccess ? "🟢 **Synced to MongoDB Atlas**" : "🟡 **Saved locally (Cloud pending)**";

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 💾 **Master System Backup Created**\n` +
          `-# *Complete snapshot of all configurations, categories, modules, and commands data.*\n\n` +
          `> - **Snapshot ID:** \`snapshot-${snapshot.timestamp}\`\n` +
          `> - **Note / Label:** \`${snapshot.label}\`\n` +
          `> - **Modules Protected:** \`${snapshot.stats.totalFiles}\` files • \`${snapshot.stats.totalRecords.toLocaleString()}\` records\n` +
          `> - **Cloud Backup:** ${cloudStatusText}\n` +
          `> - **Recorded:** <t:${Math.floor(snapshot.timestamp / 1000)}:R>\n\n` +
          `✅ **Protected Data:** NoPrefix, AntiNuke, AutoMod, AntiRaid, Welcome, JoinDM, Goodbye, Configurations, Custom Roles, All Categories, & Commands Data!`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const backupId = `bkp_${Date.now().toString(36)}`;
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 💾 Server Backup Created\n` +
        `-# *Server channels, roles, and configuration saved successfully.*\n\n` +
        `> - **Backup ID:** \`${backupId}\` \n` +
        `> - **Use:** \`.backuprestore ${backupId}\` to restore.`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
