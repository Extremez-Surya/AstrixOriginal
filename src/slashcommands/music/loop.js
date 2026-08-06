const { ApplicationCommandOptionType, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

module.exports = {
  name: "loop",
  description: "Toggle repeat mode (Off -> Track -> Queue).",
  options: [
    {
      name: "mode",
      description: "Loop mode option",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "Off", value: "none" },
        { name: "Current Track", value: "track" },
        { name: "Entire Queue", value: "queue" },
      ],
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: "❌ No music player running in this server.", flags: MessageFlags.Ephemeral });
    }

    let nextMode = interaction.options.getString("mode");
    if (!nextMode) {
      const modes = ["none", "track", "queue"];
      const currentMode = (player.loop || "none").toString().toLowerCase();
      const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
      nextMode = modes[nextIndex];
    }

    player.setLoop(nextMode);
    await updateNowPlayingMessage(client, player);

    let displayMode = "Disabled (Off)";
    if (nextMode === "track") displayMode = "Single Track 🔂";
    if (nextMode === "queue") displayMode = "Entire Queue 🔁";

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔁 Loop Mode Changed\n` +
          `> - **Current Mode:** \`${displayMode}\``
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
