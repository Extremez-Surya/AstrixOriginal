const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
  name: "move",
  description: "Move a song from one position to another in the queue.",
  options: [
    {
      name: "from",
      description: "Current position of track in queue",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: "to",
      description: "New target position in queue",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player || !player.queue.current) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          "❌ **There is no active music player running.**"
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const fromPos = interaction.options.getInteger("from");
    const toPos = interaction.options.getInteger("to");

    if (
      fromPos < 1 ||
      toPos < 1 ||
      fromPos > player.queue.length ||
      toPos > player.queue.length
    ) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Invalid position parameters.** Must be between 1 and ${player.queue.length}.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const track = player.queue.splice(fromPos - 1, 1)[0];
    player.queue.splice(toPos - 1, 0, track);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📦 **Moved:** [${track.title}](${track.uri}) from position **#${fromPos}** to **#${toPos}**.`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
