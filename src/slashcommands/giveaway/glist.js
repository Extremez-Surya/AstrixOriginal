const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  name: "giveaway_list",
  category: "Giveaway",
  description: "List all active and paused giveaways running in the server.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const serverGiveaways = giveawayManager.getGuildGiveaways(
      interaction.guild.id,
    );
    const active = serverGiveaways.filter((g) => !g.ended);

    if (active.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:tada2:1539875614440554597> Server Giveaways\n` +
            `-# *No active or paused giveaways currently running in this server.*\n\n` +
            `> - *Use \`/gstart\` to start one!*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const lines = active.map((g, index) => {
      const endUnix = Math.floor(g.endTimestamp / 1000);
      const statusStr = g.paused ? `\`Paused ⏸️\`` : `<t:${endUnix}:R>`;
      const entriesCount = g.entries ? g.entries.length : 0;
      return (
        `> **${index + 1}. ${g.prize}** (\`${g.messageId}\`)\n` +
        `> -# <:channel:1539875458970288258> **Channel:** <#${g.channelId}> • <:Trophy:1539875620270641185> **Winners:** \`${g.winnersCount}\` • <:members:1539875392532512808> **Entries:** \`${entriesCount}\` • <:clock:1539875400975388713> **Status:** ${statusStr}`
      );
    });

    const content = [
      `### <:tada2:1539875614440554597> Active Server Giveaways ── ${interaction.guild.name}`,
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

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
