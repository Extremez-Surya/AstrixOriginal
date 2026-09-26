const {
  Events,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const path = require("path");
const welcomeManager = require("../lib/welcomeManager");
const welcomeCanvas = require("../lib/welcomeCanvas");
const { renderWelcomeMessage, renderJoinDmMessage } = require("../lib/welcome/welcomeBuilder");
const loggingManager = require("../lib/loggingManager");

module.exports = {
  name: "onGuildMemberAdd",
  event: Events.GuildMemberAdd,
  once: false,

  async execute(client, member) {
    if (!member.guild) return;

    // Logging: Member Join / Bot Add
    loggingManager.dispatchLog(
      client,
      member.guild.id,
      member.user.bot ? "botAdd" : "memberJoin",
      {
        target: member.user,
        details: `Account Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R> • Member Count: \`${member.guild.memberCount}\``,
      },
      { author: member.user, member }
    ).catch(() => null);

    const config = welcomeManager.getGuildWelcome(member.guild.id);
    if (!config) return;

    // 1. Auto-Role Assignment
    if (config.autoRoleId) {
      const role = member.guild.roles.cache.get(config.autoRoleId);
      if (role && member.guild.members.me.permissions.has("ManageRoles")) {
        await member.roles.add(role).catch(() => null);
      }
    }

    // 2. Auto-Nickname Format
    if (config.autoNickFormat && member.guild.members.me.permissions.has("ManageNicknames")) {
      const formattedNick = welcomeManager.formatWelcomeText(
        config.autoNickFormat,
        member,
        member.guild
      );
      if (formattedNick) {
        await member.setNickname(formattedNick.slice(0, 32)).catch(() => null);
      }
    }

    // 3. Send Join DM if Enabled (Premade Canvas / Custom Embed / Custom Container)
    if (config.joinDmEnabled) {
      try {
        const dmPayload = await renderJoinDmMessage(member, config);
        await member.send(dmPayload).catch(() => null);
      } catch (err) {
        console.error("[onGuildMemberAdd] Failed to send Join DM:", err);
      }
    }

    // 4. Send Welcome Message (Premade Canvas / Custom Embed / Custom Container) in Channel if Enabled
    if (config.enabled && config.channelId) {
      const channel = member.guild.channels.cache.get(config.channelId);
      if (channel && channel.isTextBased()) {
        try {
          const welcomePayload = await renderWelcomeMessage(member, config);
          await channel.send(welcomePayload).catch((err) =>
            console.error("[onGuildMemberAdd] Failed to send welcome:", err)
          );
        } catch (err) {
          console.error("[onGuildMemberAdd] Error rendering welcome message:", err);
        }
      }
    }
  },
};
