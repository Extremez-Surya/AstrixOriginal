const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  AttachmentBuilder,
} = require("discord.js");
const loggingManager = require("../../lib/loggingManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["logging", "logs", "logconfig", "log"],
  category: "Logging",
  desc: "Interactive master control panel to configure and audit server logging.",
  botPermissions: ["SendMessages", "ViewAuditLog"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const guildId = message.guild.id;

    // Subcommand shortcuts
    if (args[0]) {
      const sub = args[0].toLowerCase();
      if (["enable", "on"].includes(sub)) {
        const config = loggingManager.getGuildLogging(guildId);
        config.enabled = true;
        loggingManager.setGuildLogging(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} Server Logging Enabled\n` +
            `-# *Audit events will now be dispatched to configured log channels.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
      if (["disable", "off"].includes(sub)) {
        const config = loggingManager.getGuildLogging(guildId);
        config.enabled = false;
        loggingManager.setGuildLogging(guildId, config);
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Server Logging Disabled\n` +
            `-# *Event tracking and audit log broadcasting have been paused.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      }
      if (sub === "export") {
        const exportData = loggingManager.exportLogs(guildId);
        const buffer = Buffer.from(exportData, "utf-8");
        const filename = `audit_logs_${guildId}_${new Date().toISOString().slice(0, 10)}.json`;
        const attachment = new AttachmentBuilder(buffer, { name: filename });
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 💾 Audit Logs Exported\n` +
            `-# *Historical server event log file attached below.*`
          )
        );
        return message.reply({ components: [container], files: [attachment], flags: MessageFlags.IsComponentsV2 });
      }
    }

    const buildPanel = (section = "overview", disabled = false) => {
      const config = loggingManager.getGuildLogging(guildId);
      const stats = loggingManager.getLoggingStats(guildId);

      let content = "";
      switch (section) {
        case "overview":
          const combinedChannel = config.channels.combined ? `<#${config.channels.combined}>` : "`Not Set`";
          const activeCategories = Object.entries(config.categories || {})
            .filter(([, v]) => v !== false)
            .map(([k]) => `\`${k}\``)
            .join(", ") || "`None`";

          content =
            `### 📜 Server Logging ── ${message.guild.name}\n` +
            `-# *Interactive Server Event Audit & Logging Configuration*\n\n` +
            `> - **Master Status:** ${config.enabled ? "`🟢 Enabled`" : "`🔴 Disabled`"}\n` +
            `> - **Combined Log Channel:** ${combinedChannel}\n` +
            `> - **Active Categories:** ${activeCategories}\n` +
            `> - **Recorded Events:** \`${stats.total.toLocaleString()} logs\`\n` +
            `> - **Ignored Channels:** \`${(config.ignore.channels || []).length}\` • **Roles:** \`${(config.ignore.roles || []).length}\` • **Bots:** ${config.ignore.bots ? "`Ignored`" : "`Logged`"}`;
          break;

        case "toggle":
          config.enabled = !config.enabled;
          loggingManager.setGuildLogging(guildId, config);
          content =
            `### ⚡ Master Status Toggled\n` +
            `-# *Logging system active state updated*\n\n` +
            `> - **New Status:** ${config.enabled ? "`🟢 Enabled`" : "`🔴 Disabled`"}`;
          break;

        case "channels":
          const channelLines = Object.entries(loggingManager.CATEGORY_NAMES).map(([key, name]) => {
            const chId = config.channels[key];
            return `> - **${name}:** ${chId ? `<#${chId}>` : "*Not Set*"}`;
          });

          content =
            `### 📁 Category Log Channels\n` +
            `-# *Route specific event types to dedicated channels*\n\n` +
            `> - **Combined Channel:** ${config.channels.combined ? `<#${config.channels.combined}>` : "*Not Set*"}\n\n` +
            `**Category Channels:**\n` +
            channelLines.join("\n") +
            `\n\n-# *Tip: Use \`.logchannel <category> #channel\` to set specific channels, or \`.logsetup\` to auto-create all.*`;
          break;

        case "ignore":
          const ignChans = (config.ignore.channels || []).map((id) => `<#${id}>`).join(", ") || "`None`";
          const ignRoles = (config.ignore.roles || []).map((id) => `<@&${id}>`).join(", ") || "`None`";
          const ignUsers = (config.ignore.users || []).map((id) => `<@${id}>`).join(", ") || "`None`";

          content =
            `### 🚫 Logging Ignore Filters\n` +
            `-# *Events originating from ignored targets will not be logged*\n\n` +
            `> - **Ignored Channels:** ${ignChans}\n` +
            `> - **Ignored Roles:** ${ignRoles}\n` +
            `> - **Ignored Users:** ${ignUsers}\n` +
            `> - **Ignore Bot Actions:** ${config.ignore.bots ? "`Yes (Bots Ignored)`" : "`No (Bots Logged)`"}`;
          break;

        case "stats":
          const topCats = Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => `> - **${loggingManager.CATEGORY_NAMES[cat] || cat}:** \`${count}\``)
            .join("\n") || `> *No logs recorded yet.*`;

          const newestTime = stats.newestLog ? `<t:${Math.floor(stats.newestLog / 1000)}:R>` : "`N/A`";

          content =
            `### 📊 Logging Statistics\n` +
            `-# *Audit event counts and activity distribution*\n\n` +
            `> - **Total Recorded Logs:** \`${stats.total}\`\n` +
            `> - **Most Recent Event:** ${newestTime}\n\n` +
            `**Events by Category:**\n` +
            topCats;
          break;
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId("logging_menu")
        .setPlaceholder("Select a logging section to manage...")
        .setDisabled(disabled)
        .addOptions([
          { label: "Overview", description: "View master logging overview", value: "overview", emoji: "🌐" },
          { label: "Toggle System", description: "Enable or disable logging", value: "toggle", emoji: "⚡" },
          { label: "Log Channels", description: "View and configure log channels", value: "channels", emoji: "📁" },
          { label: "Ignore Rules", description: "Manage channels, roles & bot ignore rules", value: "ignore", emoji: "🚫" },
          { label: "Statistics", description: "View logged event metrics", value: "stats", emoji: "📊" },
        ]);

      const row = new ActionRowBuilder().addComponents(menu);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(row);

      return container;
    };

    const initialContainer = buildPanel("overview");
    const replyMsg = await message.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const collector = replyMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const selected = i.values[0];
      const updatedContainer = buildPanel(selected);
      await replyMsg.edit({
        components: [updatedContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    });

    collector.on("end", async () => {
      const finalContainer = buildPanel("overview", true);
      await replyMsg.edit({
        components: [finalContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    });
  },
};
