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
  alias: ["logchannel", "setlogchannel", "loggingchannel"],
  category: "Logging",
  desc: "Configure or clear dedicated channels for specific log categories.",
  botPermissions: ["SendMessages", "ViewAuditLog"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const guildId = message.guild.id;
    const config = loggingManager.getGuildLogging(guildId);

    if (!args.length) {
      const channelLines = Object.entries(loggingManager.CATEGORY_NAMES).map(([key, name]) => {
        const chId = config.channels[key];
        return `> - **${name}:** ${chId ? `<#${chId}>` : "*Not Set*"}`;
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📁 **Current Log Channels**\n` +
          `-# *Configured log routing for ${message.guild.name}*\n\n` +
          `> - **Combined Channel:** ${config.channels.combined ? `<#${config.channels.combined}>` : "*Not Set*"}\n\n` +
          channelLines.join("\n") +
          `\n\n**Usage:**\n` +
          `> - \`.logchannel <category> #channel\`\n` +
          `> - \`.logchannel combined #channel\`\n` +
          `> - \`.logchannel clear <category|all>\``
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const firstArg = args[0].toLowerCase();

    if (firstArg === "clear") {
      const targetCat = args[1]?.toLowerCase();
      if (targetCat === "all") {
        for (const k of Object.keys(config.channels)) {
          config.channels[k] = null;
        }
        loggingManager.setGuildLogging(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} All Log Channels Cleared\n` +
            `-# *All log routing associations have been removed.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      if (config.channels[targetCat] !== undefined) {
        config.channels[targetCat] = null;
        loggingManager.setGuildLogging(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} Log Channel Cleared\n` +
            `-# *Cleared channel configuration for category:* \`${targetCat}\``
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }

      return message.reply(`Invalid category to clear. Use \`.logchannel clear all\` or specify one of: \`${Object.keys(loggingManager.CATEGORY_NAMES).join(", ")}, combined\``);
    }

    // Check if first argument is a category
    const categoryKey = firstArg in loggingManager.CATEGORY_NAMES || firstArg === "combined" ? firstArg : null;
    const mentionedChannel = message.mentions.channels.first() || (args[1] ? message.guild.channels.cache.get(args[1]) : null);

    if (categoryKey && mentionedChannel) {
      config.channels[categoryKey] = mentionedChannel.id;
      config.enabled = true;
      loggingManager.setGuildLogging(guildId, config);

      const catName = categoryKey === "combined" ? "All Events (Combined)" : loggingManager.CATEGORY_NAMES[categoryKey];

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.success || "✅"} Log Channel Linked\n` +
          `-# *Event category successfully assigned*\n\n` +
          `> - **Category:** \`${catName}\`\n` +
          `> - **Channel:** <#${mentionedChannel.id}> (\`${mentionedChannel.name}\`)`
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // If only a channel was provided, default to combined
    const singleChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if (singleChannel) {
      config.channels.combined = singleChannel.id;
      config.enabled = true;
      loggingManager.setGuildLogging(guildId, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.success || "✅"} Combined Log Channel Set\n` +
          `-# *All server audit logs will be sent to ${singleChannel}*\n\n` +
          `> - **Channel:** <#${singleChannel.id}>\n` +
          `> - **System Status:** \`🟢 Enabled\``
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    return message.reply(
      `**Usage:**\n` +
      `• \`.logchannel <category> #channel\` (Categories: \`${Object.keys(loggingManager.CATEGORY_NAMES).join(", ")}, combined\`)\n` +
      `• \`.logchannel #channel\` (Sets combined channel)`
    );
  },
};
