const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const prefixManager = require("../../lib/prefixManager");

module.exports = {
  alias: ["setprefix", "changeprefix"],
  category: "Moderation",
  desc: "Set a new custom command prefix for this server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const currentPrefix = prefixManager.getPrefix(message.guild.id);
    const newPrefix = args[0];

    if (!newPrefix) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing New Prefix\n` +
            `-# *Please specify the new prefix (e.g. \`${currentPrefix}setprefix $\`)*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    if (newPrefix.length > 5) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Prefix Too Long\n` +
            `-# *Command prefix must be 5 characters or less.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    prefixManager.setPrefix(message.guild.id, newPrefix);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:astrix:1527205612205903973> Server Prefix Updated\n` +
            `-# *Successfully set server command prefix to \`${newPrefix}\` for **${message.guild.name}**.*\n\n` +
            `> - **New Command Prefix:** \`${newPrefix}\`\n` +
            `> - **Example Usage:** \`${newPrefix}help\``,
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
