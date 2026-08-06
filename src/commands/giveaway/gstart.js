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
          `### <a:red_star:1528688099436003419> Missing Arguments\n` +
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
          `### <a:red_star:1528688099436003419> Invalid Duration\n` +
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
      `### <a:tada2:1530099488398508073> GIVEAWAY ── ${prize}`,
      `-# *Click the button below to enter the giveaway!*`,
      "",
      `> <a:red_yellow_gift:1530099989181759488> **Prize:** **${prize}**`,
      `> <a:Trophy:1530099764887289956> **Winner(s):** \`${winnersInput}\``,
      `> <:members:1528311049726591006> **Host:** ${message.author}`,
      `> <:clock:1528312173275906088> **Ends:** <t:${endUnix}:R> (<t:${endUnix}:f>)`,
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
        .setEmoji("<a:tada2:1530099488398508073>")
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
