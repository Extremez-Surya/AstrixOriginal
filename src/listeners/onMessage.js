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
const { clientPrefix } = require("../lib/config.json");
const afkManager = require("../lib/afkManager");
const prefixManager = require("../lib/prefixManager");
/** @type {import('../lib/types/index.ts').Event} */

const levelingManager = require("../lib/levelingManager");

module.exports = {
  name: "onMessage",
  event: Events.MessageCreate,
  once: false,

  async execute(client, message) {
    if (!message.channel.isTextBased()) return;
    if (message.author.bot || !message.guild) return;

    // Process Leveling XP
    levelingManager.handleMessageXp(client, message).catch(() => null);

    const guildPrefix = prefixManager.getPrefix(message.guild.id);

    // AFK Check & Clear trigger for author
    const isAfkCommand = message.content
      .toLowerCase()
      .startsWith(`${guildPrefix}afk`);
    if (!isAfkCommand) {
      const authorAfk = afkManager.checkAFK(
        message.author.id,
        message.guild.id,
      );
      if (authorAfk) {
        afkManager.removeAFK(message.author.id);
        const duration = Date.now() - authorAfk.timestamp;
        const seconds = Math.floor((duration / 1000) % 60);
        const minutes = Math.floor((duration / (1000 * 60)) % 60);
        const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
        const days = Math.floor(duration / (1000 * 60 * 60 * 24));
        let durationStr = "";
        if (days > 0) durationStr += `${days}d `;
        if (hours > 0) durationStr += `${hours}h `;
        if (minutes > 0) durationStr += `${minutes}m `;
        durationStr += `${seconds}s`;

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Welcome Back, ${message.author.username}!\n` +
              `-# *Your AFK status has been successfully cleared.*\n\n` +
              `> - **Duration:** \`${durationStr}\`\n` +
              `> - **Reason was:** \`${authorAfk.reason}\``,
          ),
        );

        await message
          .reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [], repliedUser: false },
          })
          .catch(() => null);
      }
    }

    // AFK Mention check
    if (message.mentions.users.size > 0) {
      const afkUsers = [];
      for (const [id, user] of message.mentions.users) {
        if (id === message.author.id || user.bot) continue;
        const afkInfo = afkManager.checkAFK(id, message.guild.id);
        if (afkInfo) {
          afkUsers.push({ user, afkInfo });
        }
      }

      if (afkUsers.length > 0) {
        const lines = afkUsers.map(({ user, afkInfo }) => {
          return `> - **${user.username}** is AFK: \`${afkInfo.reason}\` (<t:${Math.floor(afkInfo.timestamp / 1000)}:R>)`;
        });

        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:Sleepy:1528993260713017377> Away From Keyboard\n` +
              `-# *The following mentioned users are currently away:*\n\n` +
              lines.join("\n"),
          ),
        );

        await message
          .reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [], repliedUser: false },
          })
          .catch(() => null);
      }
    }

    // Check if the message is a pure mention of the bot
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>$`);
    if (mentionRegex.test(message.content.trim())) {
      const wsLatency = client.ws.ping;
      const memberCount = message.guild.memberCount.toLocaleString();
      const serverCount = client.guilds.cache.size.toLocaleString();
      const commandCount = client.messageCommands.size;

      // Format Uptime
      const duration = client.uptime || 0;
      const seconds = Math.floor((duration / 1000) % 60);
      const minutes = Math.floor((duration / (1000 * 60)) % 60);
      const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
      const days = Math.floor(duration / (1000 * 60 * 60 * 24));
      let uptimeStr = "";
      if (days > 0) uptimeStr += `${days}d `;
      if (hours > 0) uptimeStr += `${hours}h `;
      if (minutes > 0) uptimeStr += `${minutes}m `;
      uptimeStr += `${seconds}s`;

      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}`;

      // Set up attachments
      const astrixPath = path.join(__dirname, "../assets/astrix.png");
      const bannerAttachment = new AttachmentBuilder(astrixPath, {
        name: "astrix.png",
      });

      // Media Gallery (Wide Banner)
      const mediaItem = new MediaGalleryItemBuilder().setURL(
        "attachment://astrix.png",
      );
      const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

      // Creative, shorter unified text content
      const mainContent =
        `# <:astrix:1527205612205903973> Astrix is Online\n` +
        `-# *Active diagnostics companion — fast, clean, and accurate.*\n\n` +
        `<:list:1528313871889334382> **System Overview**\n` +
        `> -# <:prefix:1528309903972892772> **Prefix:** \`${guildPrefix}\`\n` +
        `> -# <:signal:1528310798869598291> **WebSocket:** \`${wsLatency}ms\`\n` +
        `> -# <:members:1528311049726591006> **Members:** \`${memberCount}\`\n` +
        `> -# <:servers:1528311514065535007> **Guilds:** \`${serverCount}\`\n` +
        `> -# <:prefix:1528309903972892772> **Commands:** \`${commandCount}\`\n` +
        `> -# <:clock:1528312173275906088> **Uptime:** \`${uptimeStr}\``;

      // Footer Text
      const footerContent = `-# Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™ • © 2026 ASTRIXCODE`;

      // Buttons Action Row
      const inviteButton = new ButtonBuilder()
        .setEmoji("<:invite:1527681405319123054>")
        .setLabel("Invite Me")
        .setStyle(ButtonStyle.Link)
        .setURL(inviteUrl);

      const websiteButton = new ButtonBuilder()
        .setEmoji("<:website:1528304906400960582>")
        .setLabel("Website")
        .setStyle(ButtonStyle.Link)
        .setURL("https://extremez.vercel.app/");

      const supportButton = new ButtonBuilder()
        .setEmoji("<:discord:1527683374523744367>")
        .setLabel("Support")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.gg/FR9pXG2Mwb");

      const row = new ActionRowBuilder().addComponents(
        inviteButton,
        websiteButton,
        supportButton,
      );

      // Build the final container
      const container = new ContainerBuilder()
        .addMediaGalleryComponents(mediaGallery)
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(mainContent),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(footerContent),
        )
        .addActionRowComponents(row);

      return message.reply({
        components: [container],
        files: [bannerAttachment],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    // Blacklist Check
    const noprefixManager = require("../lib/noprefixManager");
    const blInfo = noprefixManager.isBlacklisted(message.author.id, message.guild.id);
    if (blInfo.isBlacklisted) {
      const blContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🚫 **Access Denied (Blacklisted)**\n` +
            `-# *Your access to Astrix command system has been restricted by bot administrators.*\n\n` +
            `> - **Reason:** \`${blInfo.reason}\``
        )
      );
      return message.reply({
        components: [blContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    let usedPrefix = null;
    const mentionPrefixPattern = new RegExp(`^<@!?${client.user.id}>\\s*`);

    const memberRoleIds = message.member?.roles?.cache?.map((r) => r.id) || [];
    const userHasNoPrefix = noprefixManager.hasNoPrefix(message.author.id, message.guild.id, memberRoleIds, client);

    const customRolesManager = require("../lib/customRolesManager");
    const crConfig = customRolesManager.getGuildConfig(client, message.guild.id);
    const crAliases = crConfig?.aliases ? Object.keys(crConfig.aliases) : [];

    const contentTrimmed = message.content.trim();
    const firstWordRaw = contentTrimmed.split(/ +/g)[0]?.toLowerCase() || "";
    const firstWordClean = firstWordRaw.replace(/^[.\-!]+/, "");

    if (message.content.startsWith(guildPrefix)) {
      usedPrefix = guildPrefix;
    } else if (mentionPrefixPattern.test(message.content)) {
      const match = message.content.match(mentionPrefixPattern);
      usedPrefix = match[0];
    } else if (message.content.startsWith(".")) {
      const potentialAlias = contentTrimmed.slice(1).split(/ +/g)[0]?.toLowerCase();
      if (potentialAlias && (crAliases.includes(potentialAlias) || client.messageCommands.get(potentialAlias) || client.messageCommands.find((c) => c.alias?.includes(potentialAlias)))) {
        usedPrefix = ".";
      }
    } else if (userHasNoPrefix) {
      if (firstWordRaw) {
        const potentialCmd =
          client.messageCommands.get(firstWordRaw) ||
          client.messageCommands.find((c) => c.alias?.includes(firstWordRaw));

        const isCrAlias = crAliases.includes(firstWordRaw) || crAliases.includes(firstWordClean);

        if (potentialCmd || isCrAlias) {
          usedPrefix = "";
          noprefixManager.incrementExecutionCount();
        }
      }
    }

    if (usedPrefix === null) return;

    const [cmdRaw, ...args] = message.content
      .slice(usedPrefix.length)
      .trim()
      .split(/ +/g);
    const cmd = cmdRaw.toLowerCase();
    const Command =
      client.messageCommands.get(cmd) ||
      client.messageCommands.find((c) => c.alias?.includes(cmd));

    if (!Command) {
      await customRolesManager.executeAlias(client, message, cmd, args);
      return;
    }

    if (Command.devOnly && !client.developer.includes(message.author.id))
      return;

    const serverManager = require("../lib/serverManager");
    const cmdName = Command.alias?.[0] || cmd;
    const catName = Command.category;
    if (
      cmdName !== "disable" &&
      cmdName !== "enable" &&
      serverManager.isCommandDisabled(message.guild.id, message.channel.id, cmdName, catName)
    ) {
      if (serverManager.getDisableNotice(message.guild.id)) {
        const disContainer = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🚫 Command Disabled\n` +
              `-# *The command \`${cmd}\` is disabled in this channel or server.*`,
          ),
        );
        return message.reply({
          components: [disContainer],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }
      return;
    }

    if (Command.userPermissions && Command.userPermissions.length !== 0) {
      if (!message.member.permissions.has(Command.userPermissions)) {
        const perms = Array.isArray(Command.userPermissions) ? Command.userPermissions.join(", ") : Command.userPermissions;
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Permission Required\n` +
            `-# *Access denied due to missing user permissions.*\n\n` +
            `> - **Required Permission(s):** \`${perms}\``,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }
    }

    if (Command.botPermissions && Command.botPermissions.length !== 0) {
      if (!message.guild.members.me.permissions.has(Command.botPermissions)) {
        const perms = Array.isArray(Command.botPermissions) ? Command.botPermissions.join(", ") : Command.botPermissions;
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Bot Permission Required\n` +
            `-# *Action blocked: Bot lacks required server permissions.*\n\n` +
            `> - **Missing Permission(s):** \`${perms}\``,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        }).catch(() => null);
      }
    }

    Command.execute(client, message, args);
  },
};
