const { Events } = require("discord.js");
const levelingManager = require("../lib/levelingManager");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onVoiceStateUpdate",
  event: Events.VoiceStateUpdate,
  once: false,

  async execute(client, oldState, newState) {
    // Leveling Voice XP Handler
    levelingManager.handleVoiceStateUpdate(client, oldState, newState).catch(() => null);

    // Logging Dispatcher
    const member = newState.member || oldState.member;
    const guild = newState.guild || oldState.guild;
    if (!member || !guild) return;

    const guildId = guild.id;

    // 1. Voice Join
    if (!oldState.channelId && newState.channelId) {
      loggingManager.dispatchLog(
        client,
        guildId,
        "voiceJoin",
        {
          target: member.user,
          channel: newState.channel,
          details: `Joined voice channel: <#${newState.channelId}> (\`${newState.channel?.name}\`)`,
        },
        { author: member.user, channelId: newState.channelId, member }
      ).catch(() => null);
    }
    // 2. Voice Leave
    else if (oldState.channelId && !newState.channelId) {
      loggingManager.dispatchLog(
        client,
        guildId,
        "voiceLeave",
        {
          target: member.user,
          channel: oldState.channel,
          details: `Left voice channel: <#${oldState.channelId}> (\`${oldState.channel?.name}\`)`,
        },
        { author: member.user, channelId: oldState.channelId, member }
      ).catch(() => null);
    }
    // 3. Voice Switch
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      loggingManager.dispatchLog(
        client,
        guildId,
        "voiceMove",
        {
          target: member.user,
          details: `Moved from <#${oldState.channelId}> (\`${oldState.channel?.name}\`) to <#${newState.channelId}> (\`${newState.channel?.name}\`)`,
        },
        { author: member.user, channelId: newState.channelId, member }
      ).catch(() => null);
    }
    // 4. Voice Mute/Deafen State Change
    else if (oldState.serverMute !== newState.serverMute || oldState.selfMute !== newState.selfMute) {
      const isMuted = newState.serverMute || newState.selfMute;
      loggingManager.dispatchLog(
        client,
        guildId,
        "voiceMute",
        {
          target: member.user,
          channel: newState.channel,
          details: `Voice mute status: \`${isMuted ? "Muted" : "Unmuted"}\` (${newState.serverMute ? "Server Muted" : "Self Muted"})`,
        },
        { author: member.user, channelId: newState.channelId, member }
      ).catch(() => null);
    }
  },
};
