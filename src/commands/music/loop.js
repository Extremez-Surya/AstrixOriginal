const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["loop", "repeat"],
  category: "Music",
  desc: "Toggle repeat mode (Off -> Track -> Queue).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player) {
      return message.reply({
        content: "❌ No music player running in this server.",
      });
    }

    const inputMode = args[0]?.toLowerCase();
    let nextMode = "none";

    if (
      inputMode === "track" ||
      inputMode === "song" ||
      inputMode === "current"
    ) {
      nextMode = "track";
    } else if (inputMode === "queue" || inputMode === "all" || inputMode === "enable" || inputMode === "on") {
      nextMode = "queue";
    } else if (
      inputMode === "off" ||
      inputMode === "none" ||
      inputMode === "disable"
    ) {
      nextMode = "none";
    } else {
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
          `> - **Current Mode:** \`${displayMode}\``,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
