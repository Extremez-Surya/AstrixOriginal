const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["autoplay", "ap"],
  category: "Music",
  desc: "Toggle smart recommended track autoplay when queue ends.",

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

    const current = Boolean(player.data.get("autoplay"));
    const input = args[0]?.toLowerCase();
    let nextState = !current;

    if (input === "on" || input === "enable" || input === "true") {
      nextState = true;
    } else if (input === "off" || input === "disable" || input === "false") {
      nextState = false;
    }

    player.data.set("autoplay", nextState);
    await updateNowPlayingMessage(client, player);

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ♾️ Autoplay Mode ${nextState ? "Enabled" : "Disabled"}\n` +
          `-# *${nextState ? "Smart track discovery will automatically queue related songs." : "Autoplay queueing has been turned off."}*`,
      ),
    );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
