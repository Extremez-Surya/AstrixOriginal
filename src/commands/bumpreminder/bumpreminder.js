const { MessageFlags, PermissionFlagsBits, ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const bumpReminderManager = require("../../lib/bumpReminderManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildBumpReminderContainer } = require("../../lib/security/handleBumpReminderInteraction");
const EMOJIS = require("../../lib/emojis");

function buildNotice(title, description) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${title}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Automated Bump Reminder Engine`));
  return { components: [container], flags: MessageFlags.IsComponentsV2, allowedMentions: { repliedUser: false } };
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  name: "bumpreminder",
  alias: ["bumpreminder", "br", "bumpr"],
  category: "Bump Reminder",
  desc: "Automated Disboard /bump detection, 2-hour reminders, auto-lock channel & bump stats leaderboard.",
  botPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isMemberPermitted = message.member?.permissions.has(PermissionFlagsBits.ManageChannels);
    const isBotOwner = noprefixManager.isOwner(message.author.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Permissions`, "Manage Channels permission required to use Bump Reminder commands."));
    }

    const config = bumpReminderManager.getGuildBumpConfig(message.guild.id);
    const sub = args[0]?.toLowerCase();

    if (sub === "channel") {
      const channelMention = args[1] || message.channel.id;
      const channelId = channelMention.replace(/[^0-9]/g, "");
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel || !channel.isTextBased()) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Channel`, "Please specify a valid text channel."));
      }

      config.channel = channel.id;
      config.enabled = true;
      bumpReminderManager.setGuildBumpConfig(message.guild.id, config);

      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Bump Channel Configured`, `Bump reminder channel set to <#${channel.id}>.\n\n**System is now Enabled ✅.**`));
    }

    if (sub === "enable") {
      if (!config.channel) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} No Channel Set`, "Please set a bump channel first using `.bumpreminder channel <#channel>`"));
      }
      config.enabled = true;
      bumpReminderManager.setGuildBumpConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Bump Reminder Enabled`, `System enabled in <#${config.channel}>.`));
    }

    if (sub === "disable") {
      config.enabled = false;
      config.nextBump = null;
      bumpReminderManager.setGuildBumpConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Bump Reminder Disabled`, "Bump reminder system has been disabled."));
    }

    if (sub === "thankyou") {
      if (args.length === 1 || args[1]?.toLowerCase() === "view") {
        return message.reply(buildNotice("💬 Current Thank You Message", `**Message:** ${config.thankyouMessage || "Default"}\n\n**Variables:** \`{user}\` - Bumper, \`{server}\` - Server Name`));
      }
      const newMsg = args.slice(1).join(" ");
      config.thankyouMessage = newMsg;
      bumpReminderManager.setGuildBumpConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Thank You Message Updated`, `New Message: ${newMsg}`));
    }

    if (sub === "message" || sub === "reminder") {
      if (args.length === 1 || args[1]?.toLowerCase() === "view") {
        return message.reply(buildNotice("⏰ Current Reminder Message", `**Message:** ${config.reminderMessage || "Default"}\n\n**Variables:** \`{user}\` - Bumper, \`{server}\` - Server Name`));
      }
      const newMsg = args.slice(1).join(" ");
      config.reminderMessage = newMsg;
      bumpReminderManager.setGuildBumpConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Reminder Message Updated`, `New Message: ${newMsg}`));
    }

    if (sub === "autolock") {
      const choice = args[1]?.toLowerCase();
      if (choice !== "on" && choice !== "off") {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Usage`, "Usage: `.bumpreminder autolock <on|off>`"));
      }
      config.autoLock = choice === "on";
      bumpReminderManager.setGuildBumpConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Auto-Lock Updated`, `Auto-Lock is now **${config.autoLock ? "Enabled 🔒" : "Disabled 🔓"}**.`));
    }

    if (sub === "autoclean") {
      const choice = args[1]?.toLowerCase();
      if (choice !== "on" && choice !== "off") {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Usage`, "Usage: `.bumpreminder autoclean <on|off>`"));
      }
      config.autoClean = choice === "on";
      bumpReminderManager.setGuildBumpConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Auto-Clean Updated`, `Auto-Clean is now **${config.autoClean ? "Enabled 🧹" : "Disabled ❌"}**.`));
    }

    if (sub === "stats" || sub === "leaderboard") {
      const sorted = Object.entries(config.userStats || {}).sort((a, b) => b[1] - a[1]);
      let leaderStr = "";
      if (sorted.length === 0) leaderStr = "*No server bumps logged yet.*";
      else {
        sorted.slice(0, 10).forEach(([uid, count], idx) => {
          leaderStr += `**#${idx + 1}** <@${uid}> — \`${count}\` bumps\n`;
        });
      }
      return message.reply(buildNotice("📊 Server Bump Leaderboard", leaderStr));
    }

    // Default: Open Interactive Bump Reminder Control Card
    const brContainer = buildBumpReminderContainer(message.guild, message.author);

    return message.reply({
      components: [brContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    });
  },
};
