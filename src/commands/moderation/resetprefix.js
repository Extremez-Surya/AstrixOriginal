const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const prefixManager = require("../../lib/prefixManager");

module.exports = {
  alias: ["resetprefix", "defaultprefix"],
  category: "Moderation",
  desc: "Reset the server command prefix back to default (.).",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    prefixManager.resetPrefix(message.guild.id);
    const defaultPrefix = prefixManager.getPrefix(message.guild.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1527205612205903973> Server Prefix Reset\n` +
            `-# *Successfully restored default server command prefix (\`${defaultPrefix}\`) for **${message.guild.name}**.*\n\n` +
            `> - **Current Command Prefix:** \`${defaultPrefix}\`\n` +
            `> - **Example Usage:** \`${defaultPrefix}help\``,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
        ),
      );

    return message
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
