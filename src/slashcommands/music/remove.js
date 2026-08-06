const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  ApplicationCommandOptionType,
} = require("discord.js");

module.exports = {
  name: "remove",
  description: "Remove a specific track from the queue.",
  options: [
    {
      name: "position",
      description: "Queue position of track to remove",
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

    if (player.queue.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("⚠️ **The queue is empty.**")
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const position = interaction.options.getInteger("position");
    if (position < 1 || position > player.queue.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `⚠️ **Invalid track position.** Must be between 1 and ${player.queue.length}.`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const removedTrack = player.queue.splice(position - 1, 1)[0];

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `🗑️ **Removed track #${position}:** [${removedTrack.title}](${removedTrack.uri})`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
