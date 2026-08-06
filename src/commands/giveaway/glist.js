const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  alias: ["glist", "giveawaylist", "giveaways"],
  category: "Giveaway",
  desc: "List all active and paused giveaways running in the server.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const serverGiveaways = giveawayManager.getGuildGiveaways(message.guild.id);
    const active = serverGiveaways.filter((g) => !g.ended);

    if (active.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:tada2:1530099488398508073> Server Giveaways\n` +
            `-# *No active or paused giveaways currently running in this server.*\n\n` +
            `> - *Use \`.gstart <duration> <winners> <prize>\` to start one!*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const lines = active.map((g, index) => {
      const endUnix = Math.floor(g.endTimestamp / 1000);
      const statusStr = g.paused ? `\`Paused ⏸️\`` : `<t:${endUnix}:R>`;
      const entriesCount = g.entries ? g.entries.length : 0;
      return (
        `> **${index + 1}. ${g.prize}** (\`${g.messageId}\`)\n` +
        `> -# <:channel:1528678228141543557> **Channel:** <#${g.channelId}> • <a:Trophy:1530099764887289956> **Winners:** \`${g.winnersCount}\` • <:members:1528311049726591006> **Entries:** \`${entriesCount}\` • <:clock:1528312173275906088> **Status:** ${statusStr}`
      );
    });

    const content = [
      `### <a:tada2:1530099488398508073> Active Server Giveaways ── ${message.guild.name}`,
      `-# *Total Active/Paused Giveaways: \`${active.length}\`*`,
      "",
      ...lines,
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
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
