const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "say",
  alias: ["say", "broadcast", "announce", "speak"],
  category: "General",
  description: "Make the bot broadcast text in any channel, reply to messages, or edit previous announcements.",
  usage:
    ".say <text>\n" +
    ".say #channel <text>\n" +
    ".say --reply <MessageID> <text>\n" +
    ".say --edit <MessageID> <text>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isAdminOrManager) {
      return message.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to broadcast messages.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    // 1. HELP / USAGE STUDIO
    if (!args.length || args[0]?.toLowerCase() === "help" || args[0]?.toLowerCase() === "studio") {
      const container = new ContainerBuilder();

      const headerText =
        `### 📢 **Astrix Broadcast & Announcer Studio**\n` +
        `-# *Dispatch announcements, speak in remote channels, reply to members or edit previous messages.*`;
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

      const content =
        `**🎙️ Broadcast Modes & Commands:**\n` +
        `> • \`.say <message>\` — Send text in current channel *(Auto-deletes command)*\n` +
        `> • \`.say #channel <message>\` — Dispatch message directly to another channel\n` +
        `> • \`.say --reply <MessageID> <text>\` — Reply to a specific message\n` +
        `> • \`.say --edit <MessageID> <text>\` — Edit an existing bot announcement\n\n` +
        `✨ *Tip: Standard Markdown formatting, links, mentions, and emojis work seamlessly in broadcast messages.*`;

      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ High-Speed Announcer Engine`)
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    // 2. MODE: REPLY (--reply <MessageID> <text>)
    if (args[0] === "--reply") {
      if (args.length < 3) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.say --reply <MessageID> <text>`",
        }).catch(() => null);
      }

      const messageId = args[1];
      const textToSay = args.slice(2).join(" ");

      try {
        let targetMessage = null;
        try {
          targetMessage = await message.channel.messages.fetch(messageId);
        } catch {
          const channels = message.guild.channels.cache.filter((ch) => ch.isTextBased());
          for (const [, ch] of channels) {
            try {
              targetMessage = await ch.messages.fetch(messageId);
              if (targetMessage) break;
            } catch {}
          }
        }

        if (!targetMessage) {
          return message.reply({
            content: `⚠️ Message with ID \`${messageId}\` was not found.`,
          }).catch(() => null);
        }

        await targetMessage.reply({
          content: textToSay,
          allowedMentions: { parse: ["users", "roles"] },
        });

        await message.delete().catch(() => null);
      } catch (error) {
        return message.reply({
          content: `❌ Could not reply to message: ${error.message}`,
        }).catch(() => null);
      }
      return;
    }

    // 3. MODE: EDIT (--edit <MessageID> <text>)
    if (args[0] === "--edit") {
      if (args.length < 3) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.say --edit <MessageID> <new text>`",
        }).catch(() => null);
      }

      const messageId = args[1];
      const newText = args.slice(2).join(" ");

      try {
        let targetMessage = null;
        try {
          targetMessage = await message.channel.messages.fetch(messageId);
        } catch {
          const channels = message.guild.channels.cache.filter((ch) => ch.isTextBased());
          for (const [, ch] of channels) {
            try {
              targetMessage = await ch.messages.fetch(messageId);
              if (targetMessage) break;
            } catch {}
          }
        }

        if (!targetMessage) {
          return message.reply({
            content: `⚠️ Message with ID \`${messageId}\` was not found.`,
          }).catch(() => null);
        }

        if (targetMessage.author.id !== client.user.id) {
          return message.reply({
            content: "❌ I can only edit messages that were sent by me.",
          }).catch(() => null);
        }

        await targetMessage.edit({ content: newText });
        await message.delete().catch(() => null);
      } catch (error) {
        return message.reply({
          content: `❌ Could not edit message: ${error.message}`,
        }).catch(() => null);
      }
      return;
    }

    // 4. MODE: SEND IN TARGET CHANNEL (.say #channel <text>)
    let targetChannel = message.mentions.channels.first();
    let textToSay = "";

    if (targetChannel && args[0].includes(targetChannel.id)) {
      textToSay = args.slice(1).join(" ");
    } else {
      const firstArgId = args[0].replace(/\D/g, "");
      const possibleChannel = message.guild.channels.cache.get(firstArgId);
      if (possibleChannel && possibleChannel.isTextBased()) {
        targetChannel = possibleChannel;
        textToSay = args.slice(1).join(" ");
      } else {
        targetChannel = message.channel;
        textToSay = args.join(" ");
      }
    }

    if (!textToSay.trim()) {
      return message.reply({
        content: "⚠️ Please provide text to broadcast.",
      }).catch(() => null);
    }

    const sent = await targetChannel.send({
      content: textToSay,
      allowedMentions: { parse: ["users", "roles"] },
    }).catch(() => null);

    if (!sent) {
      return message.reply({
        content: `❌ Failed to send message in <#${targetChannel.id}>. Please check bot channel permissions.`,
      }).catch(() => null);
    }

    if (targetChannel.id !== message.channel.id) {
      const confirmContainer = new ContainerBuilder();
      confirmContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📢 **Broadcast Dispatched!**\n` +
          `> • 📍 **Channel:** <#${targetChannel.id}>\n` +
          `> • 👤 **Dispatched By:** <@${message.author.id}>\n` +
          `> • 💬 **Message:** ${textToSay.length > 80 ? textToSay.slice(0, 77) + "..." : textToSay}`
        )
      );

      await message.reply({
        components: [confirmContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } else {
      await message.delete().catch(() => null);
    }
  },
};
