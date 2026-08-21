const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["join", "connect", "j"],
  category: "Music",
  desc: "Join your current voice channel.",

  botPermissions: ["SendMessages", "Connect", "Speak"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    let targetChannel = message.member?.voice?.channel;

    if (args.length > 0) {
      const channelMention = message.mentions.channels.first();
      if (channelMention && channelMention.isVoiceBased?.()) {
        targetChannel = channelMention;
      } else {
        const rawId = args[0].replace(/[<#>]/g, "");
        const fetched = message.guild?.channels?.cache?.get(rawId);
        if (fetched && fetched.isVoiceBased?.()) {
          targetChannel = fetched;
        }
      }
    }

    if (!targetChannel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
            `-# *You must be in a voice channel or specify a valid voice channel to join.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const botMember = message.guild.members.me;
    const botPermissions = targetChannel.permissionsFor(botMember);
    if (!botPermissions?.has("Connect") || !botPermissions?.has("Speak")) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Permissions\n` +
            `-# *I do not have Connect and Speak permissions in <#${targetChannel.id}>.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    let player = client.manager.players.get(message.guild.id);

    if (player) {
      if (player.voiceId === targetChannel.id) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🔊 Already Connected\n` +
              `-# *I am already connected to <#${targetChannel.id}>.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      player.setVoiceChannel(targetChannel.id);
    } else {
      player = await client.manager.createPlayer({
        guildId: message.guild.id,
        voiceId: targetChannel.id,
        textId: message.channel.id,
        deaf: true,
      });
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔊 Joined Voice Channel\n` +
            `> - **Channel:** <#${targetChannel.id}>\n` +
            `-# *Ready to receive track requests.*`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Audio Engine*`),
      );

    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  },
};
