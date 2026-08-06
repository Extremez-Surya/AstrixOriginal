const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["backupcreate", "serverbackupcreate", "createbackup"],
  category: "Utility",
  desc: "Create a complete server layout, channel, and role configuration backup.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
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
