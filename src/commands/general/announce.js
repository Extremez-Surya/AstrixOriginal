const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "announce",
  alias: ["announce", "announcement", "broadcastmsg"],
  category: "General",
  description: "Send a formally formatted server announcement card.",
  usage:
    ".announce <#channel> <message>\n" +
    ".announce <message>\n" +
    ".announce --everyone <message>\n" +
    ".announce --here <message>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.MentionEveryone);

    if (!isAdminOrManager) {
      return message.reply({
        content: "❌ You need **Manage Server** or **Administrator** permission to broadcast announcements.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    if (!args.length) {
      const helpContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📢 **Official Announcement Broadcaster**\n` +
            `-# Broadcast formal notices and server updates\n\n` +
            `> **Standard Syntax:**\n` +
            `> \`.announce #announcements Maintenance will start tonight at 12:00 AM.\`\n\n` +
            `> **Mention Flags:**\n` +
            `> • \`.announce --everyone <text>\` — Pings \`@everyone\` with announcement\n` +
            `> • \`.announce --here <text>\` — Pings \`@here\` with announcement\n\n` +
            `-# The original command message is automatically deleted to keep chat clean.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Announcer Engine`));

      return message.reply({
        components: [helpContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    let targetChannel = message.mentions.channels.first();
    let textArgs = args;
    let mentionTag = "";

    if (targetChannel && args[0].includes(targetChannel.id)) {
      textArgs = args.slice(1);
    } else {
      targetChannel = message.channel;
    }

    if (textArgs[0] === "--everyone") {
      mentionTag = "@everyone";
      textArgs = textArgs.slice(1);
    } else if (textArgs[0] === "--here") {
      mentionTag = "@here";
      textArgs = textArgs.slice(1);
    }

    const announcementBody = textArgs.join(" ");

    if (!announcementBody.trim()) {
      return message.reply({
        content: "⚠️ Announcement message body cannot be empty.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const container = new ContainerBuilder();

    const header =
      `### 📢 **Official Server Announcement**\n` +
      `-# Broadcasted by <@${message.author.id}> • **${message.guild.name}**`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(header));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    const body = `> ${announcementBody.replace(/\n/g, "\n> ")}`;
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(body));

    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Official Broadcast Engine`));

    await message.delete().catch(() => null);

    const sent = await targetChannel.send({
      content: mentionTag || undefined,
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);

    if (!sent) {
      return message.reply({
        content: `❌ Failed to broadcast in <#${targetChannel.id}>. Check bot permissions.`,
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    if (targetChannel.id !== message.channel.id) {
      const confirmContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📢 **Announcement Dispatched!**\n` +
            `> • 📍 **Target Channel:** <#${targetChannel.id}>\n` +
            `> • 👤 **Author:** <@${message.author.id}>`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Announcer`));

      await message.reply({
        components: [confirmContainer],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
