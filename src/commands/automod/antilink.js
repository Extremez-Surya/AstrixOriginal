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
  alias: ["antilink", "antiinvites", "linkblock"],
  category: "Automod",
  desc: "Block unauthorized web links and Discord invite URLs in text channels.",
  botPermissions: ["ManageMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure Anti-Link.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const guildId = message.guild.id;
    let config = automodManager.getGuildAutomod(guildId);
    const option = args[0]?.toLowerCase();

    if (option === "enable" || option === "on") {
      if (!config.modules.antilink) config.modules.antilink = { enabled: true, punishments: ["delete"] };
      if (!config.modules.antiinvite) config.modules.antiinvite = { enabled: true, punishments: ["delete"] };
      config.modules.antilink.enabled = true;
      config.modules.antiinvite.enabled = true;
      config.enabled = true;
      automodManager.setGuildAutomod(guildId, config);
    } else if (option === "disable" || option === "off") {
      if (config.modules.antilink) config.modules.antilink.enabled = false;
      if (config.modules.antiinvite) config.modules.antiinvite.enabled = false;
      automodManager.setGuildAutomod(guildId, config);
    }

    config = automodManager.getGuildAutomod(guildId);
    const isLinkEnabled = config.enabled && config.modules?.antilink?.enabled;
    const isInviteEnabled = config.enabled && config.modules?.antiinvite?.enabled;
    const isAnyActive = isLinkEnabled || isInviteEnabled;

    const container = new ContainerBuilder();

    const headerText =
      `### 🌐 **Anti-Link & Anti-Invite Filter**\n` +
      `-# Automatically deletes unauthorized web links, IP grabbers, and Discord server invite links.`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const content =
      `**⚙️ Filter Status:**\n` +
      `> • 🌐 **Anti-Link Filter:** ${isLinkEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
      `> • 🔗 **Anti-Invite Filter:** ${isInviteEnabled ? "🟢 `ENABLED`" : "🔴 `DISABLED`"}\n` +
      `> • 🚫 **Blocked URL Types:** \`http://\`, \`https://\`, \`discord.gg/\`, \`discord.com/invite/\`\n` +
      `> • ⚖️ **Violation Penalty:** \`Instant Message Deletion + Strike Warning\`\n\n` +
      `💡 *Click the toggle button below or use \`.antilink on\` / \`.antilink off\`.*`;

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const toggleBtn = new ButtonBuilder()
      .setCustomId("automod_mod_toggle_antilink_btn")
      .setLabel(isAnyActive ? "Disable Anti-Link" : "Enable Anti-Link")
      .setEmoji(isAnyActive ? "🔴" : "🟢")
      .setStyle(isAnyActive ? ButtonStyle.Danger : ButtonStyle.Success);

    const cpBtn = new ButtonBuilder()
      .setCustomId("automod_nav_overview")
      .setLabel("AutoMod Control Center")
      .setEmoji("🤖")
      .setStyle(ButtonStyle.Primary);

    container.addActionRowComponents(new ActionRowBuilder().addComponents(toggleBtn, cpBtn));

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
