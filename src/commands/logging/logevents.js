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
  alias: ["logevents", "loggingevents", "logevent"],
  category: "Logging",
  desc: "View and toggle individual logging event types.",
  botPermissions: ["SendMessages", "ViewAuditLog"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const guildId = message.guild.id;
    const config = loggingManager.getGuildLogging(guildId);

    if (args[0]?.toLowerCase() === "enable" && args[1]) {
      const eventName = args[1];
      if (config.events[eventName] !== undefined) {
        config.events[eventName] = true;
        loggingManager.setGuildLogging(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} Event Enabled\n` +
            `-# *Event type \`${eventName}\` is now actively monitored and logged.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
      return message.reply(`Event \`${eventName}\` not found.`);
    }

    if (args[0]?.toLowerCase() === "disable" && args[1]) {
      const eventName = args[1];
      if (config.events[eventName] !== undefined) {
        config.events[eventName] = false;
        loggingManager.setGuildLogging(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Event Disabled\n` +
            `-# *Event type \`${eventName}\` is now ignored and will not be dispatched.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
      return message.reply(`Event \`${eventName}\` not found.`);
    }

    // List events by category
    const targetCat = args[0]?.toLowerCase();
    const categoriesToShow = targetCat && loggingManager.LOG_CATEGORIES[targetCat]
      ? { [targetCat]: loggingManager.LOG_CATEGORIES[targetCat] }
      : loggingManager.LOG_CATEGORIES;

    const sections = [];

    for (const [catKey, events] of Object.entries(categoriesToShow)) {
      const catName = loggingManager.CATEGORY_NAMES[catKey] || catKey;
      const catEnabled = config.categories[catKey] !== false;
      const eventLines = events.map((evt) => {
        const isEvtEnabled = config.events[evt] !== false;
        const icon = loggingManager.EVENT_ICONS[evt] || "•";
        return `> ${icon} \`${evt}\` ── ${isEvtEnabled && catEnabled ? "`🟢 On`" : "`🔴 Off`"}`;
      });

      sections.push(`**${catName}** (${catEnabled ? "🟢 Active" : "🔴 Disabled"}):\n` + eventLines.join("\n"));
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⚙️ **Logging Event Rules**\n` +
        `-# *Individual event tracking statuses for ${message.guild.name}*\n\n` +
        sections.join("\n\n") +
        `\n\n**Usage:**\n` +
        `> - \`.logevents enable <event_name>\`\n` +
        `> - \`.logevents disable <event_name>\`\n` +
        `> - \`.logevents <category>\``
      )
    );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
