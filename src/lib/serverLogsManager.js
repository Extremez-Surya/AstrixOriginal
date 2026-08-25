const {
  EmbedBuilder,
  WebhookClient,
  ChannelType,
} = require("discord.js");
const path = require("path");
const fs = require("fs");

const CONFIG_PATH = path.join(__dirname, "config.json");

function getGuildLogsConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      return data.guildLogs || {};
    }
  } catch (_) {}
  return {};
}

/**
 * Attempts to generate or retrieve an invite link for a guild
 * @param {import("discord.js").Guild} guild
 * @returns {Promise<string|null>}
 */
async function fetchGuildInvite(guild) {
  if (guild.vanityURLCode) {
    return `https://discord.gg/${guild.vanityURLCode}`;
  }

  try {
    let textChannel = null;
    if (guild.channels?.cache) {
      for (const c of guild.channels.cache.values()) {
        if (
          (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement) &&
          (guild.members?.me ? c.permissionsFor?.(guild.members.me)?.has?.("CreateInstantInvite") : true)
        ) {
          textChannel = c;
          break;
        }
      }
    }

    if (textChannel && typeof textChannel.createInvite === "function") {
      const invite = await textChannel.createInvite({
        maxAge: 0,
        maxUses: 0,
        reason: "Astrix Bot Server Log Integration",
      }).catch(() => null);

      if (invite?.url) return invite.url;
    }
  } catch (_) {}

  return null;
}

/**
 * Dispatches log payload via WebhookClient or Discord Channel
 */
async function dispatchLog(client, targetConfig, embedPayload) {
  if (!targetConfig || targetConfig.enabled === false) return;

  const { webhookUrl, channelId } = targetConfig;

  // 1. Send via Webhook if configured
  if (webhookUrl && typeof webhookUrl === "string" && webhookUrl.startsWith("http")) {
    try {
      const webhook = new WebhookClient({ url: webhookUrl });
      await webhook.send({
        embeds: [embedPayload],
        username: "Astrix Gateway Sentinel",
        avatarURL: client?.user?.displayAvatarURL?.() || undefined,
      });
      return;
    } catch (err) {
      console.error("[ServerLogs] Failed to dispatch via Webhook:", err.message);
    }
  }

  // 2. Send via Channel ID if configured
  if (channelId && typeof channelId === "string") {
    try {
      const channel = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
      if (channel && channel.isTextBased()) {
        await channel.send({
          embeds: [embedPayload],
        });
      }
    } catch (err) {
      console.error("[ServerLogs] Failed to dispatch via Channel:", err.message);
    }
  }
}

/**
 * Dispatches a detailed server join log
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Guild} guild
 */
async function sendGuildJoinLog(client, guild) {
  const config = getGuildLogsConfig();
  const joinConfig = config.join;
  if (!joinConfig || joinConfig.enabled === false) return;

  try {
    let ownerTag = "Unknown Owner";
    let ownerId = guild.ownerId || "Unknown";

    try {
      const ownerMember = await guild.fetchOwner().catch(() => null);
      if (ownerMember) {
        ownerTag = ownerMember.user.tag;
        ownerId = ownerMember.user.id;
      }
    } catch (_) {}

    const totalMembers = guild.memberCount || 0;
    let botCount = 0;
    if (guild.members?.cache) {
      for (const m of guild.members.cache.values()) {
        if (m?.user?.bot) botCount++;
      }
    }
    const humanCount = Math.max(0, totalMembers - botCount);

    const inviteUrl = await fetchGuildInvite(guild);
    const inviteDisplay = inviteUrl ? `[🔗 Click to Join Server](${inviteUrl})` : "*No Invite Available (No Perms)*";

    const allGuildsCount = client.guilds?.cache?.size || 0;
    let networkTotalMembers = 0;
    if (client.guilds?.cache) {
      for (const g of client.guilds.cache.values()) {
        networkTotalMembers += g.memberCount || 0;
      }
    }

    const iconUrl = guild.iconURL?.({ dynamic: true, size: 512 }) || null;

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71) // Green
      .setTitle("📥 Astrix Added to Server!")
      .setDescription(`*Bot has successfully connected to a new Discord guild.*`)
      .addFields(
        {
          name: "🏠 Server Information",
          value: `> • **Name:** **${guild.name}**\n> • **ID:** \`${guild.id}\`\n> • **Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:F> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)\n> • **Invite Link:** ${inviteDisplay}`,
          inline: false,
        },
        {
          name: "👑 Server Ownership",
          value: `> • **Owner:** <@${ownerId}> (\`${ownerTag}\`)\n> • **Owner ID:** \`${ownerId}\``,
          inline: false,
        },
        {
          name: "👥 Member Demographics",
          value: `> • **Total Members:** \`${totalMembers.toLocaleString()}\` members\n> • **Humans:** \`${humanCount.toLocaleString()}\` • **Bots:** \`${botCount.toLocaleString()}\``,
          inline: false,
        },
        {
          name: "📊 Global Bot Reach",
          value: `> • **Total Servers:** \`${allGuildsCount.toLocaleString()}\` servers\n> • **Total Users:** \`${networkTotalMembers.toLocaleString()}\` members`,
          inline: false,
        }
      )
      .setFooter({
        text: `ASTRIXCODE™ Gateway Audit • Server Joined`,
        iconURL: client.user?.displayAvatarURL?.() || undefined,
      })
      .setTimestamp();

    if (iconUrl) {
      embed.setThumbnail(iconUrl);
    }

    await dispatchLog(client, joinConfig, embed);
  } catch (err) {
    console.error("[ServerLogs] Error sending guild join log:", err);
  }
}

/**
 * Dispatches a detailed server leave log
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Guild} guild
 */
async function sendGuildLeaveLog(client, guild) {
  const config = getGuildLogsConfig();
  const leaveConfig = config.leave;
  if (!leaveConfig || leaveConfig.enabled === false) return;

  try {
    let ownerTag = "Unknown Owner";
    let ownerId = guild.ownerId || "Unknown";

    try {
      const ownerMember = await guild.fetchOwner().catch(() => null);
      if (ownerMember) {
        ownerTag = ownerMember.user.tag;
        ownerId = ownerMember.user.id;
      }
    } catch (_) {}

    const totalMembers = guild.memberCount || 0;
    const allGuildsCount = client.guilds?.cache?.size || 0;
    let networkTotalMembers = 0;
    if (client.guilds?.cache) {
      for (const g of client.guilds.cache.values()) {
        networkTotalMembers += g.memberCount || 0;
      }
    }

    const iconUrl = guild.iconURL?.({ dynamic: true, size: 512 }) || null;

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c) // Red
      .setTitle("📤 Astrix Removed from Server!")
      .setDescription(`*Bot has left, been kicked, or banned from a server.*`)
      .addFields(
        {
          name: "🏠 Server Information",
          value: `> • **Name:** **${guild.name || "Unknown"}**\n> • **ID:** \`${guild.id}\`\n> • **Member Count:** \`${totalMembers.toLocaleString()}\` members`,
          inline: false,
        },
        {
          name: "👑 Server Ownership",
          value: `> • **Owner:** <@${ownerId}> (\`${ownerTag}\`)\n> • **Owner ID:** \`${ownerId}\``,
          inline: false,
        },
        {
          name: "📊 Global Bot Reach Now",
          value: `> • **Total Servers:** \`${allGuildsCount.toLocaleString()}\` servers\n> • **Total Users:** \`${networkTotalMembers.toLocaleString()}\` members`,
          inline: false,
        }
      )
      .setFooter({
        text: `ASTRIXCODE™ Gateway Audit • Server Removed`,
        iconURL: client.user?.displayAvatarURL?.() || undefined,
      })
      .setTimestamp();

    if (iconUrl) {
      embed.setThumbnail(iconUrl);
    }

    await dispatchLog(client, leaveConfig, embed);
  } catch (err) {
    console.error("[ServerLogs] Error sending guild leave log:", err);
  }
}

module.exports = {
  getGuildLogsConfig,
  sendGuildJoinLog,
  sendGuildLeaveLog,
};
