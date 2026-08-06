const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const { updateNowPlayingMessage } = require("../../lib/musicManager.js");

function createVolumeContainer(volume) {
  const currentVol = Math.min(Math.max(volume ?? 100, 0), 100);
  const filledCount = Math.round((currentVol / 100) * 10);
  const emptyCount = 10 - filledCount;
  const progressBar = `\`[ ${"▰".repeat(filledCount)}${"▱".repeat(emptyCount)} ]\` **${currentVol}%**`;

  const header = new TextDisplayBuilder().setContent(
    `### 🔊 Volume Level\n${progressBar}`
  );

  const rowPresets = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vol_0")
      .setLabel("Mute")
      .setEmoji("🔇")
      .setStyle(currentVol === 0 ? ButtonStyle.Danger : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_25")
      .setLabel("25%")
      .setEmoji("🔉")
      .setStyle(currentVol === 25 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_50")
      .setLabel("50%")
      .setEmoji("🔊")
      .setStyle(currentVol === 50 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_75")
      .setLabel("75%")
      .setEmoji("🔊")
      .setStyle(currentVol === 75 ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_100")
      .setLabel("100%")
      .setEmoji("📢")
      .setStyle(currentVol === 100 ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  const rowSteps = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vol_down_10")
      .setLabel("-10%")
      .setEmoji("➖")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("vol_up_10")
      .setLabel("+10%")
      .setEmoji("➕")
      .setStyle(ButtonStyle.Secondary)
  );

  return new ContainerBuilder()
    .addTextDisplayComponents(header)
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(rowPresets, rowSteps);
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["volume", "vol", "v"],
  category: "Music",
  desc: "Adjust audio playback volume (0 - 100%).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  createVolumeContainer,

  async execute(client, message, args) {
    const player = client.manager.players.get(message.guild.id);
    if (!player) {
      return message.reply({
        content: "❌ No music player running in this server.",
      });
    }

    if (args[0]) {
      const volArg = parseInt(args[0], 10);
      if (!isNaN(volArg)) {
        const targetVolume = Math.min(Math.max(volArg, 0), 100);
        await player.setVolume(targetVolume);
        await updateNowPlayingMessage(client, player);
      }
    }

    const container = createVolumeContainer(player.volume);

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
