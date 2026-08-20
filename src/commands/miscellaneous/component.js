const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

function replaceVariables(text, context) {
  if (!text) return text;
  const now = new Date();
  return text
    .replace(/\\n/gi, "\n")
    .replace(/\{user\}/gi, context.user?.username || "")
    .replace(/\{user\.mention\}/gi, context.user ? `<@${context.user.id}>` : "")
    .replace(/\{user\.name\}/gi, context.user?.username || "")
    .replace(/\{user\.tag\}/gi, context.user?.tag || "")
    .replace(/\{user\.id\}/gi, context.user?.id || "")
    .replace(/\{user\.avatar\}/gi, context.user?.displayAvatarURL?.() || "")
    .replace(/\{guild\.name\}/gi, context.guild?.name || "")
    .replace(/\{guild\.icon\}/gi, context.guild?.iconURL?.() || "")
    .replace(/\{guild\.membercount\}/gi, context.guild?.memberCount?.toString() || "")
    .replace(/\{guild\.id\}/gi, context.guild?.id || "")
    .replace(/\{channel\}/gi, context.channel?.name || "")
    .replace(/\{channel\.mention\}/gi, context.channel ? `<#${context.channel.id}>` : "")
    .replace(/\{timestamp\}/gi, `<t:${Math.floor(now.getTime() / 1000)}>`)
    .replace(/\{timestamp\.relative\}/gi, `<t:${Math.floor(now.getTime() / 1000)}:R>`)
    .replace(/\{timestamp\.full\}/gi, `<t:${Math.floor(now.getTime() / 1000)}:F>`);
}

function parseContainerCode(code, context) {
  const container = new ContainerBuilder();
  const parts = code.split(/\$v/gi);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^\{([\w\d]+)\s*:\s*(.+)\}$/s);
    if (!match) continue;

    const type = match[1].toLowerCase();
    const value = replaceVariables(match[2], context);

    switch (type) {
      case "text":
      case "content": {
        const textParts = value.split("&&").map((p) => p.trim());
        const content = textParts[0];
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
        break;
      }

      case "separator":
      case "sep":
      case "divider": {
        container.addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );
        break;
      }

      case "media":
      case "image":
      case "gallery": {
        const urls = value.split("&&").map((u) => u.trim()).filter(Boolean);
        if (urls.length > 0) {
          const gallery = new MediaGalleryBuilder();
          for (const url of urls) {
            gallery.addItems(new MediaGalleryItemBuilder().setURL(url));
          }
          container.addMediaGalleryComponents(gallery);
        }
        break;
      }
    }
  }

  return container;
}

const TEMPLATES = {
  announcement: {
    label: "📢 Server Announcement",
    code: "{text: # 📢 Server Announcement\\n-# Official community broadcast} $v {sep: true} $v {text: We are thrilled to announce exciting new updates to **{guild.name}**!\\n\\nStay tuned for upcoming events and features.} $v {sep: true} $v {text: -# Broadcasted by {user} • {timestamp.full}}",
  },
  rules: {
    label: "📜 Community Rules",
    code: "{text: # 📜 **{guild.name} Rules**\\n-# Please review our community guidelines} $v {sep: true} $v {text: **1. Respect Everyone** — Treat all members with kindness.\\n**2. No Spam** — Keep channels clean and on-topic.\\n**3. Follow ToS** — Adhere to Discord Community Guidelines.} $v {sep: true} $v {text: -# Failure to follow rules may result in moderation actions.}",
  },
  patchnotes: {
    label: "🛠️ Update & Patch Notes",
    code: "{text: # 🛠️ **System Update & Changelog**\\n-# Latest platform enhancements} $v {sep: true} $v {text: ✦ **Performance:** 10x faster response latency.\\n✦ **Logging:** Complete server event audit suite.\\n✦ **Leveling:** Anti-cheat protection & XP rewards.} $v {sep: true} $v {text: -# Powered by Astrix • {timestamp.relative}}",
  },
  verification: {
    label: "🛡️ Server Verification",
    code: "{text: # 🛡️ **Member Verification**\\n-# Welcome to {guild.name}} $v {sep: true} $v {text: To access all server channels, please complete verification below.\\nMake sure your DMs are open for security notices.} $v {sep: true} $v {text: -# Secured by Astrix Security Engine}",
  },
};

module.exports = {
  alias: ["component", "compbuilder", "createcomponent"],
  category: "Miscellaneous",
  desc: "Build and send rich Discord Components V2 messages or select pre-built templates.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const targetChannel = message.mentions.channels.first();

    if (targetChannel || (args[0] && args.join(" ").includes("{"))) {
      const codeText = targetChannel ? args.slice(1).join(" ") : args.join(" ");
      const context = { user: message.author, guild: message.guild, channel: targetChannel || message.channel };
      const sendChannel = targetChannel || message.channel;

      try {
        const container = parseContainerCode(codeText, context);
        await sendChannel.send({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });

        const confirm = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${EMOJIS.success || "✅"} Component Sent\n` +
            `-# *Rich container dispatched to ${sendChannel}*`
          )
        );
        return message.reply({ components: [confirm], flags: MessageFlags.IsComponentsV2 });
      } catch (err) {
        return message.reply(`❌ Failed to send component: \`${err.message}\``);
      }
    }

    // Interactive Dropdown Menu for Template Presets & Instructions
    const menu = new StringSelectMenuBuilder()
      .setCustomId("component_templates")
      .setPlaceholder("Select a production template to load code...")
      .addOptions([
        { label: "Server Announcement", description: "Rich announcement template", value: "announcement", emoji: "📢" },
        { label: "Community Rules", description: "Pre-formatted server rules", value: "rules", emoji: "📜" },
        { label: "Patch Notes", description: "Changelog and update announcement", value: "patchnotes", emoji: "🛠️" },
        { label: "Member Verification", description: "Verification portal container", value: "verification", emoji: "🛡️" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const helpContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🧩 **Rich Component Builder**\n` +
          `-# *Create high-end Discord Components V2 messages*\n\n` +
          `**Syntax:** \`.component #channel {text: Content} $v {sep: true} $v {media: url}\`\n\n` +
          `**Available Tags:**\n` +
          `> - \`{text: Message Content}\` ── Text display element\n` +
          `> - \`{separator: true}\` ── Visual divider\n` +
          `> - \`{media: https://url/image.png}\` ── High-res media item\n\n` +
          `**Variables:** \`{user}\`, \`{user.mention}\`, \`{guild.name}\`, \`{guild.membercount}\`, \`{timestamp.full}\`\n\n` +
          `*Select a template below to view its ready-to-use syntax:*`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(row);

    const replyMsg = await message.reply({
      components: [helpContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const collector = replyMsg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      const selected = i.values[0];
      const template = TEMPLATES[selected];
      if (template) {
        const templateContainer = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### ${template.label} Template Code\n` +
              `-# *Copy and customize the code below:*\n\n` +
              `\`\`\`\n.component ${template.code}\n\`\`\``
            )
          )
          .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addActionRowComponents(row);

        await replyMsg.edit({ components: [templateContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }
    });
  },
};
