const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const configManager = require("../../lib/configManager");
const noprefixManager = require("../../lib/noprefixManager");
const { buildConfigurationContainer } = require("../../lib/security/handleConfigurationInteraction");

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
      return message.reply({
        content: "❌ You need **Manage Server** permission to configure auto-reactions.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const config = configManager.getGuildConfig(message.guild.id);
    const sub = args[0]?.toLowerCase();

    // 1. .reaction add <emoji> <phrase>
    if (sub === "add" || sub === "create" || sub === "set") {
      const emoji = args[1];
      const trig = args.slice(2).join(" ").trim();

      if (!emoji || !trig) {
        return message.reply({
          content: "⚠️ **Invalid Format.**\n*Usage:* `.reaction add <emoji> <phrase>`\n*Example:* `.reaction add 👍 hello`",
        }).catch(() => null);
      }

      config.reactionTriggers.push({
        id: `react_${Date.now()}`,
        emoji,
        trigger: trig,
        matchMode: "includes",
      });

      configManager.setGuildConfig(message.guild.id, config);
      const container = buildConfigurationContainer(message.guild, "reactions");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 2. .reaction remove <phrase>
    if (sub === "remove" || sub === "delete" || sub === "del") {
      const trig = args.slice(1).join(" ").trim().toLowerCase();
      if (!trig) {
        return message.reply({
          content: "⚠️ Please specify a keyword reaction to remove.\n*Usage:* `.reaction remove <phrase>`",
        }).catch(() => null);
      }

      const initialLen = config.reactionTriggers.length;
      config.reactionTriggers = config.reactionTriggers.filter((rt) => (rt.trigger || "").toLowerCase() !== trig);

      if (config.reactionTriggers.length < initialLen) {
        configManager.setGuildConfig(message.guild.id, config);
      }

      const container = buildConfigurationContainer(message.guild, "reactions");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 3. .reaction messages <#channel> <emojis...>
    if (sub === "messages" || sub === "channel") {
      const channelMention = args[1];
      if (!channelMention) {
        return message.reply({
          content: "⚠️ **Missing Channel.**\n*Usage:* `.reaction messages <#channel> <emojis...>`",
        }).catch(() => null);
      }

      const channelId = channelMention.replace(/[^0-9]/g, "");
      const channel = message.guild.channels.cache.get(channelId);

      if (!channel) {
        return message.reply({
          content: "⚠️ Please mention a valid text channel.",
        }).catch(() => null);
      }

      const emojiArr = args.slice(2);
      if (emojiArr.length === 0) {
        // Remove channel reaction
        config.channelReactions = config.channelReactions.filter((cr) => cr.channelId !== channelId);
      } else {
        const idx = config.channelReactions.findIndex((cr) => cr.channelId === channelId);
        if (idx !== -1) {
          config.channelReactions[idx].emojis = emojiArr;
        } else {
          config.channelReactions.push({ channelId, emojis: emojiArr });
        }
      }

      configManager.setGuildConfig(message.guild.id, config);
      const container = buildConfigurationContainer(message.guild, "reactions");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 4. .reaction clear
    if (sub === "clear" || sub === "reset") {
      config.reactionTriggers = [];
      config.channelReactions = [];
      configManager.setGuildConfig(message.guild.id, config);
      const container = buildConfigurationContainer(message.guild, "reactions");
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Default / list: Open Reactions Tab
    const container = buildConfigurationContainer(message.guild, "reactions");
    return message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
