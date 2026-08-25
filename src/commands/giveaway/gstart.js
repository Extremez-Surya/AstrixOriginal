const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const giveawayManager = require("../../lib/giveawayManager");

module.exports = {
  alias: ["gstart", "giveawaystart", "gcreate"],
  category: "Giveaway",
  desc: "Start a new interactive giveaway in the current channel.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const durationInput = args[0];
    const winnersInput = parseInt(args[1], 10);
    const prize = args.slice(2).join(" ");

    if (!durationInput || isNaN(winnersInput) || winnersInput < 1 || !prize) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Arguments\n` +
            `-# *Usage: \`.gstart <duration> <winners> <prize>\`*\n\n` +
            `> - **Example:** \`.gstart 10m 1 Discord Nitro\`\n` +
            `> - **Duration units:** \`s\` (seconds), \`m\` (minutes), \`h\` (hours), \`d\` (days)`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const durationMs = giveawayManager.parseDuration(durationInput);
    if (!durationMs || durationMs < 5000) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Duration\n` +
            `-# *Please specify a valid duration string equal to or greater than 5s (e.g. \`10m\`, \`2h\`, \`1d\`).*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const endTimestamp = Date.now() + durationMs;
    const endUnix = Math.floor(endTimestamp / 1000);

    const content = [
      `### <:tada2:1539875614440554597> GIVEAWAY ── ${prize}`,
      `-# *Click the button below to enter the giveaway!*`,
      "",
      `> <:red_yellow_gift:1539875626364698735> **Prize:** **${prize}**`,
      `> <:Trophy:1539875620270641185> **Winner(s):** \`${winnersInput}\``,
      `> <:members:1539875392532512808> **Host:** ${message.author}`,
      `> <:clock:1539875400975388713> **Ends:** <t:${endUnix}:R> (<t:${endUnix}:f>)`,
    ].join("\n");

    const tempContainer = new ContainerBuilder()
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

    const giveawayMsg = await message.channel
      .send({
        components: [tempContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);

    if (!giveawayMsg) {
      return message
        .reply("❌ Failed to create giveaway message in this channel.")
        .catch(() => null);
    }

    const entryButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_entry_${giveawayMsg.id}`)
        .setEmoji("🎉")
        .setLabel("Enter")
        .setStyle(ButtonStyle.Primary),
    );

    const finalContainer = new ContainerBuilder()
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
      )
      .addActionRowComponents(entryButton);

    await giveawayMsg
      .edit({
        components: [finalContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);

    const giveawayData = {
      messageId: giveawayMsg.id,
      channelId: message.channel.id,
      guildId: message.guild.id,
      prize,
      winnersCount: winnersInput,
      endTimestamp,
      hostId: message.author.id,
      entries: [],
      ended: false,
      paused: false,
    };

    giveawayManager.saveGiveaway(giveawayData);
    giveawayManager.scheduleEndTimer(client, giveawayData);

    if (message.deletable) {
      await message.delete().catch(() => {});
    }
  },
};
