const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
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
  name: "giveaway_start",
  category: "Giveaway",
  description: "Start a new interactive giveaway in the current channel.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "duration",
      description: "Giveaway duration (e.g. 10m, 1h, 2d, 30s).",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "winners",
      description: "Number of winners to select.",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      minValue: 1,
      maxValue: 20,
    },
    {
      name: "prize",
      description: "Prize description for the giveaway.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const durationInput = interaction.options.getString("duration");
    const winnersInput = interaction.options.getInteger("winners");
    const prize = interaction.options.getString("prize");

    const durationMs = giveawayManager.parseDuration(durationInput);
    if (!durationMs || durationMs < 5000) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Invalid Duration\n` +
            `-# *Please specify a valid duration string equal to or greater than 5s (e.g. \`10m\`, \`2h\`, \`1d\`).*`,
        ),
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const endTimestamp = Date.now() + durationMs;
    const endUnix = Math.floor(endTimestamp / 1000);

    const content = [
      `### <:tada2:1539875614440554597> GIVEAWAY ── ${prize}`,
      `-# *Click the button below to enter the giveaway!*`,
      "",
      `> <:red_yellow_gift:1539875626364698735> **Prize:** **${prize}**`,
      `> <:Trophy:1539875620270641185> **Winner(s):** \`${winnersInput}\``,
      `> <:members:1539875392532512808> **Host:** ${interaction.user}`,
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

    const giveawayMsg = await interaction.channel
      .send({
        components: [tempContainer],
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);

    if (!giveawayMsg) {
      return interaction.reply({
        content: "❌ Failed to create giveaway message in this channel.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const entryButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_entry_${giveawayMsg.id}`)
        .setLabel("Enter")
        .setEmoji("🎉")
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
      channelId: interaction.channel.id,
      guildId: interaction.guild.id,
      prize,
      winnersCount: winnersInput,
      endTimestamp,
      hostId: interaction.user.id,
      entries: [],
      ended: false,
      paused: false,
    };

    giveawayManager.saveGiveaway(giveawayData);
    giveawayManager.scheduleEndTimer(client, giveawayData);

    const confirmContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### <:tada2:1539875614440554597> Giveaway Created Successfully\n` +
          `-# *Giveaway started in <#${interaction.channel.id}> for **${prize}**.*`,
      ),
    );

    return interaction.reply({
      components: [confirmContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
