const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const loggingManager = require("../../lib/loggingManager");
const EMOJIS = require("../../lib/emojis");

const CATEGORY_CHANNEL_MAP = {
  message: "msg-logs",
  member: "member-logs",
  mod: "mod-logs",
  server: "server-logs",
  voice: "voice-logs",
  role: "role-logs",
  channel: "channel-logs",
  emoji: "emoji-logs",
};

module.exports = {
  alias: ["logsetup", "setuplogs", "loggingsetup"],
  category: "Logging",
  desc: "Automated wizard to create and configure server audit log channels.",
  botPermissions: ["SendMessages", "ManageChannels", "ViewAuditLog"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;
    const guildId = guild.id;

    if (args[0]?.toLowerCase() === "combined" || args[0]?.toLowerCase() === "single") {
      const parentCat = await guild.channels.create({
        name: "AUDIT LOGS",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
          },
        ],
      }).catch(() => null);

      const logChannel = await guild.channels.create({
        name: "server-logs",
        type: ChannelType.GuildText,
        parent: parentCat?.id || null,
        topic: "Server event audit logs • Powered by Astrix",
      }).catch(() => null);

      if (!logChannel) {
        return message.reply("Failed to create log channel. Please check bot permissions (`Manage Channels`).");
      }

      const config = loggingManager.getGuildLogging(guildId);
      config.enabled = true;
      config.channels.combined = logChannel.id;
      loggingManager.setGuildLogging(guildId, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.success || "✅"} Combined Log Channel Configured\n` +
          `-# *All server events will now be dispatched to ${logChannel}*\n\n` +
          `> - **Channel:** <#${logChannel.id}>\n` +
          `> - **System Status:** \`🟢 Active\``
        )
      );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    if (args[0]?.toLowerCase() === "all" || args[0]?.toLowerCase() === "auto") {
      const waitMsg = await message.reply("⚙️ *Creating category and dedicated log channels, please wait...*");

      const parentCat = await guild.channels.create({
        name: "AUDIT LOGS",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
          },
        ],
      }).catch(() => null);

      const config = loggingManager.getGuildLogging(guildId);
      config.enabled = true;

      const createdList = [];

      for (const [catKey, channelName] of Object.entries(CATEGORY_CHANNEL_MAP)) {
        const ch = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: parentCat?.id || null,
          topic: `Audit logs for ${catKey} events • Powered by Astrix`,
        }).catch(() => null);

        if (ch) {
          config.channels[catKey] = ch.id;
          createdList.push(`> - **${loggingManager.CATEGORY_NAMES[catKey]}:** <#${ch.id}>`);
        }
      }

      loggingManager.setGuildLogging(guildId, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.success || "✅"} Dedicated Log Suite Configured\n` +
          `-# *Successfully created and linked dedicated log channels*\n\n` +
          createdList.join("\n") +
          `\n\n> - **System Status:** \`🟢 Active\``
        )
      );

      return waitMsg.edit({ content: null, components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // Interactive Wizard Prompt
    const singleBtn = new ButtonBuilder()
      .setCustomId("setup_single")
      .setLabel("Single Combined Channel")
      .setEmoji("📄")
      .setStyle(ButtonStyle.Primary);

    const fullBtn = new ButtonBuilder()
      .setCustomId("setup_full")
      .setLabel("Dedicated Channels (All Categories)")
      .setEmoji("📁")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(singleBtn, fullBtn);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🛠️ **Automated Log Setup Wizard**\n` +
          `-# *Select your preferred server logging structure below:*\n\n` +
          `> - **1. Single Combined Channel:** Creates a private \`#server-logs\` channel for all server events.\n` +
          `> - **2. Dedicated Channels:** Automatically creates a private \`AUDIT LOGS\` category with separate channels for Messages, Members, Mod, Voice, Roles, and Server updates.\n\n` +
          `*Click an option below or type \`.logsetup all\` / \`.logsetup single\`*`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(row);

    const replyMsg = await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const collector = replyMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      if (i.customId === "setup_single") {
        await replyMsg.delete().catch(() => null);
        module.exports.execute(client, message, ["single"]);
      } else if (i.customId === "setup_full") {
        await replyMsg.delete().catch(() => null);
        module.exports.execute(client, message, ["all"]);
      }
    });
  },
};
