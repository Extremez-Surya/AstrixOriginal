const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

module.exports = {
  name: "autoplay",
  description: "Toggle smart recommended track autoplay when queue ends.",
  options: [
    {
      name: "state",
      description: "Enable or disable autoplay mode",
      type: 3, // String
      required: false,
      choices: [
        { name: "Enable (On)", value: "on" },
        { name: "Disable (Off)", value: "off" },
      ],
    },
  ],

  async execute(client, interaction) {
    const player = client.manager.players.get(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: "❌ No music player running in this server.", flags: MessageFlags.Ephemeral });
    }

    const current = Boolean(player.data.get("autoplay"));
    const choice = interaction.options.getString("state");
    let nextState = !current;
    if (choice === "on") nextState = true;
    if (choice === "off") nextState = false;

    player.data.set("autoplay", nextState);
    await updateNowPlayingMessage(client, player);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ♾️ Autoplay Mode ${nextState ? "Enabled" : "Disabled"}\n` +
          `-# *${nextState ? "Smart track discovery will automatically queue related songs." : "Autoplay queueing has been turned off."}*`
      )
    );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
