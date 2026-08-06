const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["ignore", "unignore"],
  category: "Utility",
  desc: "Ignore or unignore specific channels or users from triggering bot commands.",
  botPermissions: ["ManageGuild"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const type = args[0]?.toLowerCase();
    const target = message.mentions.channels.first() || message.mentions.users.first();

    if (!type || !target) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 Ignore System\n` +
          `-# *Restrict bot command execution in specific channels or for users.*\n\n` +
          `> - **Usage:** \`.ignore channel #channel\` | \`.ignore user @user\`\n` +
          `> - **Usage:** \`.ignore list\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Ignore Settings Updated\n` +
        `-# *Target ignored from bot interactions.*\n\n` +
        `> - **Ignored Target:** ${target} (\`${target.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
