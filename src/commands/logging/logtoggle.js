const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const loggingManager = require("../../lib/loggingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["logtoggle", "togglelog", "loggingtoggle"],
  category: "Logging",
  desc: "Quickly toggle the master logging system or specific event categories on/off.",
  botPermissions: ["SendMessages", "ViewAuditLog"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const guildId = message.guild.id;
    const config = loggingManager.getGuildLogging(guildId);

    if (args[0]) {
      const catInput = args[0].toLowerCase();
      if (loggingManager.LOG_CATEGORIES[catInput]) {
        config.categories[catInput] = !config.categories[catInput];
        loggingManager.setGuildLogging(guildId, config);

        const isEnabled = config.categories[catInput];
        const catName = loggingManager.CATEGORY_NAMES[catInput] || catInput;

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${isEnabled ? (EMOJIS.success || "✅") : (EMOJIS.cross || "❌")} Category Toggled\n` +
            `-# *Category tracking state updated*\n\n` +
            `> - **Category:** \`${catName}\`\n` +
            `> - **Status:** ${isEnabled ? "`🟢 Enabled`" : "`🔴 Disabled`"}`
          )
        );

        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
    }

    config.enabled = !config.enabled;
    loggingManager.setGuildLogging(guildId, config);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${config.enabled ? (EMOJIS.success || "✅") : (EMOJIS.cross || "❌")} Master Logging Toggled\n` +
        `-# *Server event logging state updated*\n\n` +
        `> - **Master Status:** ${config.enabled ? "`🟢 Enabled`" : "`🔴 Disabled`"}`
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
