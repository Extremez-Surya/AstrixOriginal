const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const prefixManager = require("../../lib/prefixManager");

module.exports = {
  alias: ["prefix", "showprefix", "serverprefix"],
  category: "Moderation",
  desc: "Show the current active command prefix for this server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const currentPrefix = prefixManager.getPrefix(message.guild.id);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1527205612205903973> Server Prefix Telemetry\n` +
            `-# *Active command prefix configuration for **${message.guild.name}**.*\n\n` +
            `> - **Current Prefix:** \`${currentPrefix}\`\n` +
            `> - **Set New Prefix:** \`${currentPrefix}setprefix <new_prefix>\`\n` +
            `> - **Reset to Default:** \`${currentPrefix}resetprefix\``,
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
