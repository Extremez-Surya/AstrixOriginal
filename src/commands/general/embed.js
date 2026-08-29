const {
  MessageFlags,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} = require("discord.js");
const embedManager = require("../../lib/embedManager");

module.exports = {
  name: "embed",
  alias: [
    "embed",
    "embeds",
    "cembed",
    "embedbuilder",
    "embedstudio",
  ],
  category: "General",
  description: "Create, manage, and visually edit custom embeds with interactive studio and variable support.",
  usage:
    ".embed create <name>\n" +
    ".embed edit all <name>\n" +
    ".embed edit <field> <name> <value>\n" +
    ".embed list\n" +
    ".embed show <name>\n" +
    ".embed send <name> <#channel>\n" +
    ".embed delete <name>\n" +
    ".reset server embeds\n" +
    ".set custom embedcolor <hex>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const guildId = message.guild.id;
    const isAdminOrManager =
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!isAdminOrManager) {
      return message.reply({
        content: "❌ You need **Manage Messages** or **Manage Server** permission to use Embed Studio.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const sub1 = args[0]?.toLowerCase();
    const sub2 = args[1]?.toLowerCase();

    // 0. RESET ALL EMBEDS (.reset server embeds or .embed reset)
    if (
      sub1 === "reset" ||
      (sub1 === "server" && sub2 === "embeds") ||
      (args[0] === "reset" && args[1] === "server" && args[2] === "embeds")
    ) {
      embedManager.resetGuildEmbeds(guildId);
      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🧹 **Server Embeds Reset**\n` +
            `-# Successfully deleted all custom embeds for **${message.guild.name}**.`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Embed Studio`));

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 0.1 SET CUSTOM EMBED COLOR (.set custom embedcolor <hex> or .embed setcolor <hex>)
    if (
      (sub1 === "custom" && sub2 === "embedcolor") ||
      sub1 === "setcolor" ||
      sub1 === "color" && sub2 === "default"
    ) {
      const colorArg = (sub1 === "custom" ? args[2] : (sub1 === "setcolor" ? args[1] : args[2])) || "#5865F2";
      const cleanColor = embedManager.setGuildCustomColor(guildId, colorArg);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 🎨 **Custom Embed Color Updated**\n` +
            `-# Server default response and embed color is now set to **\`${cleanColor}\`**!`
          )
        )
        .addSeparatorComponents(
          new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        )
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Embed Studio`));

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    // 1. EMBED LIST (.embed list / .embed)
    if (!args.length || sub1 === "list" || sub1 === "viewall") {
      const listView = embedManager.buildEmbedListView(message.guild);
      return message.reply({
        components: [listView],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 2. CREATE EMBED (.embed create <name>)
    if (sub1 === "create" || sub1 === "new" || sub1 === "add") {
      const name = args[1]?.toLowerCase().trim();
      if (!name) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.embed create <name>`\n*Example:* `.embed create wlcm`",
        }).catch(() => null);
      }

      if (embedManager.getEmbed(guildId, name)) {
        return message.reply({
          content: `⚠️ An embed named **\`${name}\`** already exists. Use \`.embed edit all ${name}\` to edit it.`,
        }).catch(() => null);
      }

      embedManager.saveEmbed(guildId, name, {
        name,
        title: `Embed: ${name}`,
        description: "Click the buttons below to customize this embed!",
        color: embedManager.getGuildCustomColor(guildId),
      });

      const studioMsg = embedManager.buildEmbedStudioMessage(guildId, name, message.member, message.guild);
      return message.reply({
        ...studioMsg,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 3. EDIT ALL / LAUNCH INTERACTIVE STUDIO (.embed edit all <name> or .embed studio <name>)
    if ((sub1 === "edit" && sub2 === "all") || sub1 === "studio") {
      const name = (sub1 === "edit" ? args[2] : args[1])?.toLowerCase().trim();
      if (!name) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.embed edit all <name>`\n*Example:* `.embed edit all wlcm`",
        }).catch(() => null);
      }

      let embedData = embedManager.getEmbed(guildId, name);
      if (!embedData) {
        embedData = embedManager.saveEmbed(guildId, name, {
          name,
          title: `Embed: ${name}`,
          description: "Click the buttons below to customize this embed!",
          color: embedManager.getGuildCustomColor(guildId),
        });
      }

      const studioMsg = embedManager.buildEmbedStudioMessage(guildId, name, message.member, message.guild);
      return message.reply({
        ...studioMsg,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 4. INDIVIDUAL FIELD EDITS (.embed edit <field> <name> <value>)
    if (sub1 === "edit") {
      const field = args[1]?.toLowerCase();
      const name = args[2]?.toLowerCase().trim();
      const value = args.slice(3).join(" ").trim();

      if (!field || !name) {
        return message.reply({
          content:
            "⚠️ **Invalid Usage.**\n" +
            "*Syntax:* `.embed edit <title|description|color|author|footer|image|thumbnail|timestamp> <name> <value>`\n" +
            "*Or launch visual editor:* `.embed edit all <name>`",
        }).catch(() => null);
      }

      let embedData = embedManager.getEmbed(guildId, name);
      if (!embedData) {
        embedData = {
          name,
          title: `Embed: ${name}`,
          description: "Click the buttons below to customize this embed!",
          color: embedManager.getGuildCustomColor(guildId),
        };
      }

      switch (field) {
        case "title":
          embedData.title = value || null;
          break;
        case "desc":
        case "description":
          embedData.description = value || null;
          break;
        case "color":
        case "hex":
          embedData.color = value.startsWith("#") ? value : `#${value}`;
          break;
        case "author":
          embedData.authorName = value || null;
          break;
        case "footer":
          embedData.footerText = value || null;
          break;
        case "img":
        case "image":
          embedData.image = value || null;
          break;
        case "thumb":
        case "thumbnail":
          embedData.thumbnail = value || null;
          break;
        case "time":
        case "timestamp":
          embedData.timestamp = value.toLowerCase() === "true" || value.toLowerCase() === "on" || value.toLowerCase() === "enable";
          break;
        default:
          return message.reply({
            content: `⚠️ Unknown field \`${field}\`. Supported fields: \`title\`, \`description\`, \`color\`, \`author\`, \`footer\`, \`image\`, \`thumbnail\`, \`timestamp\`, \`all\`.`,
          }).catch(() => null);
      }

      embedManager.saveEmbed(guildId, name, embedData);

      const studioMsg = embedManager.buildEmbedStudioMessage(guildId, name, message.member, message.guild);
      return message.reply({
        ...studioMsg,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 5. SHOW / PREVIEW EMBED (.embed show <name> or .embed preview <name>)
    if (sub1 === "show" || sub1 === "preview" || sub1 === "view") {
      const name = args[1]?.toLowerCase().trim();
      if (!name) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.embed show <name>`",
        }).catch(() => null);
      }

      const embedData = embedManager.getEmbed(guildId, name);
      if (!embedData) {
        return message.reply({
          content: `❌ Embed **\`${name}\`** not found. Run \`.embed list\` to see saved embeds.`,
        }).catch(() => null);
      }

      const rendered = embedManager.renderEmbed(embedData, message.member, message.guild);
      return message.reply({
        embeds: [rendered],
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 6. SEND TO CHANNEL (.embed send <name> <#channel>)
    if (sub1 === "send" || sub1 === "dispatch" || sub1 === "post") {
      const name = args[1]?.toLowerCase().trim();
      const targetChannel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[2]?.replace(/\D/g, "")) ||
        message.channel;

      if (!name) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.embed send <name> [#channel]`",
        }).catch(() => null);
      }

      const embedData = embedManager.getEmbed(guildId, name);
      if (!embedData) {
        return message.reply({
          content: `❌ Embed **\`${name}\`** not found. Run \`.embed list\` to see saved embeds.`,
        }).catch(() => null);
      }

      const rendered = embedManager.renderEmbed(embedData, message.member, message.guild);
      const sent = await targetChannel.send({ embeds: [rendered] }).catch(() => null);

      if (!sent) {
        return message.reply({
          content: `❌ Could not send embed to <#${targetChannel.id}>. Check bot permissions.`,
        }).catch(() => null);
      }

      if (targetChannel.id !== message.channel.id) {
        return message.reply({
          content: `✅ Embed **\`${name}\`** sent to <#${targetChannel.id}>!`,
        }).catch(() => null);
      } else {
        await message.delete().catch(() => null);
      }
      return;
    }

    // 7. DELETE EMBED (.embed delete <name>)
    if (sub1 === "delete" || sub1 === "remove" || sub1 === "del") {
      const name = args[1]?.toLowerCase().trim();
      if (!name) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.embed delete <name>`",
        }).catch(() => null);
      }

      const deleted = embedManager.deleteEmbed(guildId, name);
      if (deleted) {
        return message.reply({
          content: `🗑️ Embed **\`${name}\`** has been deleted.`,
        }).catch(() => null);
      } else {
        return message.reply({
          content: `❌ Embed **\`${name}\`** does not exist.`,
        }).catch(() => null);
      }
    }

    // Default fallback to list
    const listView = embedManager.buildEmbedListView(message.guild);
    return message.reply({
      components: [listView],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
