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
  alias: ["antispam", "spamfilter"],
  category: "Automod",
  desc: "Configure anti-spam message rate-limiting and strike penalties.",
  botPermissions: ["ManageMessages", "ModerateMembers"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure Anti-Spam.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    let config = automodManager.getGuildAutomod(guildId);
    const status = args[0]?.toLowerCase();

    if (status === "enable" || status === "on") {
      if (!config.modules.antispam) config.modules.antispam = { enabled: true, punishments: ["warn"] };
      config.modules.antispam.enabled = true;
      config.enabled = true;
      automodManager.setGuildAutomod(guildId, config);
    } else if (status === "disable" || status === "off") {
      if (config.modules.antispam) config.modules.antispam.enabled = false;
      automodManager.setGuildAutomod(guildId, config);
    }

    config = automodManager.getGuildAutomod(guildId);
    const isEnabled = config.enabled && config.modules?.antispam?.enabled;
    const threshold = config.modules?.antispam?.threshold || 5;
    const windowSec = config.modules?.antispam?.window || 5;

    const container = new ContainerBuilder();

    const headerText =
      `### 📨 **Anti-Spam Filter Configuration**\n` +
      `-# Rate-limits rapid message flooding and punishes spam bots.`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const content =
      `**⚙️ Filter Status:**\n` +
      `> • 📨 **Anti-Spam Filter:** ${isEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
      `> • ⏱️ **Rate Limit Window:** \`${threshold} messages per ${windowSec} seconds\`\n` +
      `> • ⚖️ **Violation Penalty:** \`Warning + Message Deletion + Auto-Timeout\`\n\n` +
      `💡 *Click the toggle button below or use \`.antispam on\` / \`.antispam off\`.*`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const toggleBtn = new ButtonBuilder()
      .setCustomId("automod_mod_toggle_antispam_btn")
      .setLabel(isEnabled ? "Disable Anti-Spam" : "Enable Anti-Spam")
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
