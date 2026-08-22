const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { getGuildConfig, setGuildConfig } = require("../../lib/starboardManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["starboardemoji", "sbemoji", "staremoji"],
  category: "Starboard",
  desc: "Add, remove, or view star reaction emojis and their required thresholds.",

  botPermissions: ["SendMessages", "EmbedLinks"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const isPermitted =
      message.member?.permissions.has("ManageGuild") ||
      client.developer?.includes(message.author.id);

    if (!isPermitted) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Permission Denied\n` +
            `-# *You need the Manage Server permission to configure Starboard emojis.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const config = getGuildConfig(message.guild.id);
    const action = args[0]?.toLowerCase();

    if (!action || action === "list") {
      let emojiList = "";
      if (!config.emojis || config.emojis.length === 0) {
        emojiList = "*No emojis configured.*";
      } else {
        emojiList = config.emojis
          .map((e, i) => `> **${i + 1}.** ${e.emoji} — Threshold: \`${e.threshold} reactions\``)
          .join("\n");
      }

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⭐ Starboard Emojis & Thresholds\n\n` +
              `${emojiList}\n\n` +
              `**Usage:**\n` +
              `> - \`.sbemoji add <emoji> [threshold]\` — Add or update star emoji threshold\n` +
              `> - \`.sbemoji remove <emoji>\` — Remove star emoji`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Starboard Engine*`),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (action === "add") {
      const emojiInput = args[1];
      if (!emojiInput) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Missing Emoji\n` +
              `-# *Please specify the emoji to add (e.g. \`.sbemoji add ⭐ 3\`).*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const threshold = Math.max(1, Math.min(parseInt(args[2], 10) || 3, 100));

      const existingIdx = config.emojis.findIndex((e) => e.emoji === emojiInput);
      if (existingIdx !== -1) {
        config.emojis[existingIdx].threshold = threshold;
      } else {
        config.emojis.push({ emoji: emojiInput, threshold });
      }

      setGuildConfig(message.guild.id, config);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ Star Emoji Configured\n` +
              `> - **Emoji:** ${emojiInput}\n` +
              `> - **Required Reactions:** \`${threshold}\`\n` +
              `-# *Messages with ${threshold}+ ${emojiInput} reactions will be sent to the starboard.*`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Starboard Engine*`),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (action === "remove" || action === "delete") {
      const emojiInput = args[1];
      if (!emojiInput) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Missing Emoji\n` +
              `-# *Please specify the emoji to remove.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const before = config.emojis.length;
      config.emojis = config.emojis.filter((e) => e.emoji !== emojiInput);

      if (config.emojis.length === before) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Not Found\n` +
              `-# *Emoji ${emojiInput} was not in the starboard emoji list.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      setGuildConfig(message.guild.id, config);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🗑️ Star Emoji Removed\n` +
            `-# *Removed ${emojiInput} from starboard triggers.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }
  },
};
