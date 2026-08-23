const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const automodManager = require("../../lib/automodManager");

module.exports = {
  alias: ["anticaps", "capsfilter"],
  category: "Automod",
  desc: "Filter and auto-delete messages containing excessive capital letters.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure Anti-Caps.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    let config = automodManager.getGuildAutomod(guildId);
    const action = args[0]?.toLowerCase();

    if (action === "enable" || action === "on") {
      if (!config.modules.anticaps) config.modules.anticaps = { enabled: true, punishments: ["delete"], threshold: 70 };
      config.modules.anticaps.enabled = true;
      config.enabled = true;
      automodManager.setGuildAutomod(guildId, config);
    } else if (action === "disable" || action === "off") {
      if (config.modules.anticaps) config.modules.anticaps.enabled = false;
      automodManager.setGuildAutomod(guildId, config);
    }

    config = automodManager.getGuildAutomod(guildId);
    const isEnabled = config.enabled && config.modules?.anticaps?.enabled;
    const threshold = config.modules?.anticaps?.threshold || 70;

    const container = new ContainerBuilder();

    const headerText =
      `### 🔠 **Anti-Caps Filter Configuration**\n` +
      `-# Automatically purges shouting messages containing excessive uppercase letters.`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const content =
      `**⚙️ Filter Status:**\n` +
      `> • 🔠 **Anti-Caps Filter:** ${isEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
      `> • 📊 **Uppercase Threshold:** \`>${threshold}% Capital Letters (Min length: 8)\`\n` +
      `> • ⚖️ **Violation Penalty:** \`Instant Message Deletion\`\n\n` +
      `💡 *Click the toggle button below or use \`.anticaps on\` / \`.anticaps off\`.*`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const toggleBtn = new ButtonBuilder()
      .setCustomId("automod_mod_toggle_anticaps_btn")
      .setLabel(isEnabled ? "Disable Anti-Caps" : "Enable Anti-Caps")
      .setEmoji(isEnabled ? "🔴" : "🟢")
      .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

    const cpBtn = new ButtonBuilder()
      .setCustomId("automod_nav_overview")
      .setLabel("AutoMod Control Center")
      .setEmoji("🤖")
      .setStyle(ButtonStyle.Primary);

    container.addActionRowComponents(new ActionRowBuilder().addComponents(toggleBtn, cpBtn));

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
