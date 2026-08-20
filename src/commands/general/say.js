const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  name: "say",
  alias: ["say", "broadcast", "announce"],
  category: "General",
  description: "Make the bot say something in the current channel, a specified channel, or edit/reply to a message.",
  usage:
    ".say <text>\n" +
    ".say #channel <text>\n" +
    ".say --reply <MessageID> <text>\n" +
    ".say --edit <MessageID> <text>",

  async execute(client, message, args) {
    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isAdminOrManager) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Denied\n` +
            `-# *You need **Manage Server** or **Administrator** permission to use broadcast/say.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (!args.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📢 Say Command Usage\n` +
            `> • \`.say <text>\` - Send text in current channel\n` +
            `> • \`.say #channel <text>\` - Send text in specified channel\n` +
            `> • \`.say --reply <MessageID> <text>\` - Reply to a message\n` +
            `> • \`.say --edit <MessageID> <text>\` - Edit a previous bot message`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    // MODE: REPLY
    if (args[0] === "--reply") {
      if (args.length < 3) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Invalid Usage\n` +
              `-# *Syntax: \`.say --reply <MessageID> <text>\`*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
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
          throw new Error("Message not found");
        }

        await targetMessage.reply({ content: textToSay });
        await message.react(EMOJIS.tick || "✅").catch(() => null);
      } catch (error) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Message Not Found\n` +
              `-# *Could not locate message with ID \`${messageId}\` in any channel.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }
      return;
    }

    // MODE: EDIT
    if (args[0] === "--edit") {
      if (args.length < 3) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Invalid Usage\n` +
              `-# *Syntax: \`.say --edit <MessageID> <new text>\`*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
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

        if (!targetMessage || targetMessage.author.id !== client.user.id) {
          throw new Error("Target message is not a bot message");
        }

        await targetMessage.edit({ content: newText });
        await message.react(EMOJIS.tick || "✅").catch(() => null);
      } catch (error) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.cross || "❌"} Edit Failed\n` +
              `-# *Could not edit message \`${messageId}\`. Ensure the message ID is correct and was sent by the bot.*`
          )
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }
      return;
    }

    // MODE: CHANNEL OR DIRECT
    let targetChannel = message.channel;
    let textToSay = args.join(" ");

    if (args[0] && args[0].startsWith("<#") && args[0].endsWith(">")) {
      const channelId = args[0].slice(2, -1);
      const mentionedChannel = message.guild.channels.cache.get(channelId);

      if (mentionedChannel) {
        targetChannel = mentionedChannel;
        textToSay = args.slice(1).join(" ");
      }
    }

    if (!textToSay.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Missing Text\n` +
            `-# *Please provide text for the bot to broadcast.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const botPerms = targetChannel.permissionsFor(message.guild.members.me);
    if (!botPerms.has(PermissionFlagsBits.SendMessages)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.cross || "❌"} Permission Error\n` +
            `-# *I do not have permission to send messages in ${targetChannel}.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    await targetChannel.send({ content: textToSay });
    await message.react(EMOJIS.tick || "✅").catch(() => null);
  },
};
