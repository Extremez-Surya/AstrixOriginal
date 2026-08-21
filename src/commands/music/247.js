const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["247", "stay", "24-7", "twentyfourseven"],
  category: "Music",
  desc: "Toggle 24/7 mode to keep the bot in the voice channel indefinitely.",

  botPermissions: ["SendMessages", "Connect", "Speak"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const voiceChannel =
      message.member?.voice?.channel ||
      (message.member?.voice?.channelId
        ? message.guild?.channels?.cache?.get(message.member.voice.channelId)
        : null);

    if (!voiceChannel) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
            `-# *You must be connected to a voice channel to configure 24/7 mode.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    let player = client.manager?.players.get(message.guild.id);

    if (!player) {
      const botMember = message.guild.members.me;
      const botPermissions = voiceChannel.permissionsFor(botMember);

      if (!botPermissions?.has("Connect") || !botPermissions?.has("Speak")) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Missing Permissions\n` +
              `-# *I do not have Connect and Speak permissions in <#${voiceChannel.id}>.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      player = await client.manager.createPlayer({
        guildId: message.guild.id,
        voiceId: voiceChannel.id,
        textId: message.channel.id,
        deaf: true,
        shardId: message.guild.shardId ?? 0,
      });
    } else if (player.voiceId !== voiceChannel.id) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Channel Mismatch\n` +
            `-# *You must be in <#${player.voiceId}> to modify 24/7 settings.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const current247 = Boolean(player.data?.get("is247") || player.is247);
    const input = args[0]?.toLowerCase();
    let nextState = !current247;

    if (input === "on" || input === "enable" || input === "true") {
      nextState = true;
    } else if (input === "off" || input === "disable" || input === "false") {
      nextState = false;
    }

    if (!player.data) player.data = new Map();
    player.data.set("is247", nextState);
    player.is247 = nextState;

    if (client.voiceHealthMonitor) {
      client.voiceHealthMonitor.updateActivity(message.guild.id);
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${nextState ? "🟢 24/7 Mode Enabled" : "🔴 24/7 Mode Disabled"}\n` +
            `> - **Voice Channel:** <#${voiceChannel.id}>\n` +
            `> - **Status:** \`${nextState ? "Persistent (Stay in VC)" : "Standard (Auto-Disconnect)"}\`\n\n` +
            `-# *${nextState ? "The bot will remain connected to your voice channel indefinitely even when idle." : "The bot will automatically disconnect when the queue finishes or the voice channel is empty."}*`,
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
