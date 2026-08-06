const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["backuplist", "serverbackuplist", "listbackups"],
  category: "Utility",
  desc: "List all available backups created for this server.",
  botPermissions: ["Administrator"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 💾 Saved Server Backups\n` +
        `-# *List of available server snapshots.*\n\n` +
        `> - **Total Backups:** \`0 saved\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
