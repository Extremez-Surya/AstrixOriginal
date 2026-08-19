const { MessageFlags, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require("discord.js");
const configManager = require("../../lib/configManager");
const noprefixManager = require("../../lib/noprefixManager");
const EMOJIS = require("../../lib/emojis");

function buildNotice(title, description) {
  const container = new ContainerBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${title}`))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description))
    .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Configuration Engine`));
  return { components: [container], flags: MessageFlags.IsComponentsV2, allowedMentions: { repliedUser: false } };
}

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  name: "reaction",
  alias: ["reaction", "rt", "reactiontrigger", "autoreact"],
  category: "Configuration",
  desc: "Manage automated emoji reactions to keyword triggers or specific channels.",
  botPermissions: ["AddReactions"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const isMemberPermitted = message.member?.permissions.has(PermissionFlagsBits.ManageGuild);
    const isBotOwner = noprefixManager.isOwner(message.author.id, client);

    if (!isMemberPermitted && !isBotOwner) {
      return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Permissions`, "Manage Server permission required."));
    }

    const config = configManager.getGuildConfig(message.guild.id);
    const sub = args[0]?.toLowerCase();

    if (sub === "add" || sub === "create") {
      const emoji = args[1];
      const trig = args.slice(2).join(" ").trim();

      if (!emoji || !trig) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Format`, "Usage: `.reaction add <emoji> <trigger>`\nExample: `.reaction add 👍 hello`"));
      }

      config.reactionTriggers.push({
        id: `react_${Date.now()}`,
        emoji,
        trigger: trig,
        matchMode: "includes",
      });

      configManager.setGuildConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Reaction Trigger Added`, `**Emoji:** ${emoji}\n**Trigger:** \`${trig}\``));
    }

    if (sub === "remove" || sub === "delete" || sub === "del") {
      const trig = args.slice(1).join(" ").trim().toLowerCase();
      if (!trig) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Trigger`, "Usage: `.reaction remove <trigger>`"));
      }

      const initialLen = config.reactionTriggers.length;
      config.reactionTriggers = config.reactionTriggers.filter((rt) => (rt.trigger || "").toLowerCase() !== trig);

      if (config.reactionTriggers.length < initialLen) {
        configManager.setGuildConfig(message.guild.id, config);
        return message.reply(buildNotice(`${EMOJIS.success || "✅"} Reaction Trigger Removed`, `Removed reaction trigger \`${trig}\`.`));
      } else {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Not Found`, `Reaction trigger \`${trig}\` not found.`));
      }
    }

    if (sub === "messages" || sub === "channel") {
      const channelMention = args[1];
      if (!channelMention) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Missing Channel`, "Usage: `.reaction messages <#channel> <emojis...>`"));
      }

      const channelId = channelMention.replace(/[^0-9]/g, "");
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel) {
        return message.reply(buildNotice(`${EMOJIS.error || "❌"} Invalid Channel`, "Please specify a valid text channel."));
      }

      const emojiArr = args.slice(2);
      if (emojiArr.length === 0) {
        // Remove channel reaction
        config.channelReactions = config.channelReactions.filter((cr) => cr.channelId !== channelId);
        configManager.setGuildConfig(message.guild.id, config);
        return message.reply(buildNotice(`${EMOJIS.success || "✅"} Channel Reactions Removed`, `Removed auto-reactions from <#${channelId}>.`));
      }

      const idx = config.channelReactions.findIndex((cr) => cr.channelId === channelId);
      if (idx !== -1) {
        config.channelReactions[idx].emojis = emojiArr;
      } else {
        config.channelReactions.push({ channelId, emojis: emojiArr });
      }

      configManager.setGuildConfig(message.guild.id, config);
      return message.reply(buildNotice(`${EMOJIS.success || "✅"} Channel Auto-Reactions Configured`, `Channel: <#${channelId}>\nEmojis: ${emojiArr.join(" ")}`));
    }

    if (sub === "list" || sub === "ls") {
      let listStr = "";
      if (config.reactionTriggers.length > 0) {
        listStr += "**😀 Keyword Reactions:**\n";
        config.reactionTriggers.forEach((rt, i) => {
          listStr += `> ${rt.emoji} — \`${rt.trigger}\`\n`;
        });
        listStr += "\n";
      }

      if (config.channelReactions.length > 0) {
        listStr += "**📸 Channel Auto-Reactions:**\n";
        config.channelReactions.forEach((cr) => {
          listStr += `> <#${cr.channelId}> — ${cr.emojis?.join(" ")}\n`;
        });
      }

      if (!listStr) listStr = "*No auto-reactions configured.*";

      return message.reply(buildNotice(`${EMOJIS.info || "📋"} Auto-Reactions Directory`, listStr));
    }

    // Default Help Notice
    return message.reply(
      buildNotice(
        "😀 Reaction Trigger Commands",
        "**Usage:**\n" +
        "> `.reaction add <emoji> <trigger>` — Add keyword auto-react\n" +
        "> `.reaction remove <trigger>` — Remove keyword auto-react\n" +
        "> `.reaction messages <#channel> <emojis...>` — Set channel auto-emojis\n" +
        "> `.reaction list` — View active reaction triggers"
      )
    );
  },
};
