const { Events, ChannelType, PermissionFlagsBits } = require("discord.js");
const j2cManager = require("../lib/j2cManager");

module.exports = {
  name: "onVoiceStateUpdate",
  event: Events.VoiceStateUpdate,
  once: false,

  async execute(client, oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guildId = guild.id;
    const config = j2cManager.getGuildJ2C(guildId);

    // 1. Handle Member Joining or Switching into J2C Hub Generator Channel
    if (newState.channelId && j2cManager.isHubChannel(guildId, newState.channelId)) {
      try {
        const hubChannel = newState.channel;
        if (!hubChannel) return;

        const categoryId = config.categoryChannelId || hubChannel.parentId;
        const nameTemplate = config.nameTemplate || "🔊 {user}'s Lounge";
        const roomName = nameTemplate.replace(/\{user\}/gi, member.user.username);

        const tempChannel = await guild.channels.create({
          name: roomName,
          type: ChannelType.GuildVoice,
          parent: categoryId,
          userLimit: config.userLimit || 0,
          permissionOverwrites: [
            {
              id: guild.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
            },
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
              ],
            },
            {
              id: client.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
              ],
            },
          ],
          reason: `J2C Temp VC generated for ${member.user.tag}`,
        });

        // Track temp channel
        j2cManager.addTempChannel(guildId, tempChannel.id, member.id);

        // Move member into newly created temp channel
        await member.voice.setChannel(tempChannel).catch((err) => {
          console.error("[onVoiceStateUpdate] Failed to move member to temp VC:", err);
        });

        // Post Interactive Control Panel inside newly created voice channel chat
        try {
          const { buildJ2CControlPayload } = require("../lib/j2c/handleJ2CControlInteraction");
          const payload = await buildJ2CControlPayload(guild, tempChannel);
          await tempChannel.send(payload).catch(() => null);
        } catch (_) {}
      } catch (err) {
        console.error("[onVoiceStateUpdate] Error creating J2C temp channel:", err);
      }
    }

    // 2. Handle Member Leaving or Switching out of a J2C Temp Voice Channel
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      if (j2cManager.isTempChannel(guildId, oldState.channelId)) {
        try {
          const oldChannel = oldState.channel;
          if (oldChannel && oldChannel.members.size === 0) {
            await oldChannel.delete("J2C temp channel empty").catch(() => null);
            j2cManager.removeTempChannel(guildId, oldState.channelId);
          }
        } catch (err) {
          console.error("[onVoiceStateUpdate] Error deleting empty J2C temp channel:", err);
        }
      }
    }
  },
};
