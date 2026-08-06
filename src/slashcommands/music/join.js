const {
  ApplicationCommandType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

module.exports = {
  name: "join",
  category: "Music",
  description: "Join your voice channel.",
  type: ApplicationCommandType.ChatInput,

  botPermissions: ["SendMessages", "Connect", "Speak"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
            `-# *You must be connected to a voice channel for the bot to join.*`
        )
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    let player = client.manager.players.get(interaction.guild.id);

    if (player) {
      if (player.voiceId === voiceChannel.id) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔊 Already Connected\n` +
              `-# *I am already connected to your voice channel (<#${voiceChannel.id}>).*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      player.setVoiceChannel(voiceChannel.id);
    } else {
      player = await client.manager.createPlayer({
        guildId: interaction.guild.id,
        voiceId: voiceChannel.id,
        textId: interaction.channel.id,
        deaf: true,
      });
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔊 Joined Voice Channel\n` +
            `> - **Channel:** <#${voiceChannel.id}>\n` +
            `-# *Ready to receive track requests.*`
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *ASTRIXCODE™ Audio Engine*`
        )
      );

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
