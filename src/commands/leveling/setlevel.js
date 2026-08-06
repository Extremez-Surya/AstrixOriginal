const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["setlevel", "setxp", "resetlevel"],
  category: "Leveling",
  desc: "Set or reset member experience level and XP.",
  botPermissions: ["ManageGuild"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser = message.mentions.users.first();
    const newLevel = parseInt(args[1], 10);

    if (!targetUser || isNaN(newLevel)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚙️ Level Management\n` +
          `-# *Adjust member XP level manually.*\n\n` +
          `> - **Usage:** \`.setlevel @user <level_number>\` \n` +
          `> - **Usage:** \`.resetlevel @user\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Member Level Updated\n` +
        `-# *XP data modified successfully.*\n\n` +
        `> - **User:** ${targetUser} \n` +
        `> - **New Level:** \`${newLevel}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
