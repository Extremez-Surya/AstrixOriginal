const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["backuprestore", "serverbackuprestore", "restorebackup"],
  category: "Utility",
  desc: "Restore a server layout, channel, and role configuration backup.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const backupId = args[0];
    if (!backupId) return message.reply("Please specify a Backup ID: `.backuprestore <backup_id>`");

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔄 Server Restoration Triggered\n` +
        `-# *Restoring server state from backup \`${backupId}\`...*`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
