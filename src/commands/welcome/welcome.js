const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");
const path = require("path");
const welcomeManager = require("../../lib/welcomeManager");
const welcomeCanvas = require("../../lib/welcomeCanvas");

module.exports = {
  alias: ["welcome", "greet", "welcomer", "welcomesetup"],
  category: "Welcome",
  desc: "Comprehensive Welcome System Manager — enable, disable, config, reset, edit, test & personalize greetings.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();

    // -------------------------------------------------------------
    // SUBCOMMAND: ENABLE / ON
    // -------------------------------------------------------------
    if (sub === "enable" || sub === "on") {
      const config = welcomeManager.updateGuildWelcome(message.guild.id, { enabled: true });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Welcome Module Activated\n` +
          `-# *Greetings for new member joins are now ENABLED.*\n\n` +
          `> - **Welcome Channel:** ${config.channelId ? `<#${config.channelId}>` : "`Not set (use .welcome channel #channel)`"}\n` +
          `> - **Canvas Card:** \`${config.canvasEnabled ? "ENABLED" : "DISABLED"}\`\n` +
          `> - **Auto-Role:** ${config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`"}\n` +
          `> - **Join DM:** \`${config.joinDmEnabled ? "ENABLED" : "DISABLED"}\`\n\n` +
          `> **Tip:** Use \`.welcome test\` to preview your live welcome message!`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: DISABLE / OFF
    // -------------------------------------------------------------
    if (sub === "disable" || sub === "off") {
      welcomeManager.updateGuildWelcome(message.guild.id, { enabled: false });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ Welcome Module Deactivated\n` +
          `-# *Member join greetings are currently DISABLED.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: CONFIG / STATUS / SETTINGS
    // -------------------------------------------------------------
    if (sub === "config" || sub === "status" || sub === "settings") {
      const config = welcomeManager.getGuildWelcome(message.guild.id);
      const channelMention = config.channelId ? `<#${config.channelId}>` : "`Not Configured`";
      const roleMention = config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`";

      const previewText = welcomeManager.formatWelcomeText(
        config.messageText,
        message.member || message.author,
        message.guild
      );

      const mainContent =
        `# ⚙️ Welcome System Configuration Details\n` +
        `-# *Full overview of all active welcome parameters for ${message.guild.name}.*\n\n` +
        `### 📌 Status & Channels\n` +
        `> - **Module State:** \`${config.enabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
        `> - **Target Channel:** ${channelMention}\n` +
        `> - **Auto-Assign Role:** ${roleMention}\n\n` +
        `### 🖼️ Canvas Image Settings\n` +
        `> - **Canvas Card:** \`${config.canvasEnabled ? "ENABLED" : "DISABLED"}\`\n` +
        `> - **Background URL:** ${config.canvasBgUrl ? `[Custom Image](${config.canvasBgUrl})` : "`Default Dark Gradient`"}\n\n` +
        `### 📩 Join DM Settings\n` +
        `> - **Join DM State:** \`${config.joinDmEnabled ? "ENABLED" : "DISABLED"}\`\n` +
        `> - **DM Message:** \`${config.joinDmText}\`\n\n` +
        `### 💬 Channel Message Template\n` +
        `\`\`\`\n${config.messageText}\n\`\`\`\n` +
        `> **Formatted Live Output Preview:**\n` +
        `> ${previewText}`;

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(mainContent)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: RESET
    // -------------------------------------------------------------
    if (sub === "reset") {
      welcomeManager.resetGuildWelcome(message.guild.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔄 Welcome Configuration Reset\n` +
          `-# *All welcome parameters have been restored to default values.*\n\n` +
          `> - **Status:** \`DISABLED\`\n` +
          `> - **Channel:** \`None\`\n` +
          `> - **Message:** Reset to default template\n` +
          `> - **Canvas Card:** \`ENABLED (Default BG)\`\n` +
          `> - **Auto-Role:** \`None\`\n` +
          `> - **Join DM:** \`DISABLED\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: EDIT / EDITALL
    // -------------------------------------------------------------
    if (sub === "edit" || sub === "editall") {
      // If user provides key=value format like `.welcome edit channel=#welcome message=Hello {user}!`
      const paramStr = args.slice(1).join(" ");

      if (paramStr && paramStr.includes("=")) {
        const updates = {};
        const channelMatch = paramStr.match(/channel=(<#(\d+)>|(\d+))/i);
        if (channelMatch) {
          const chId = channelMatch[2] || channelMatch[3];
          if (message.guild.channels.cache.has(chId)) updates.channelId = chId;
        }

        const msgMatch = paramStr.match(/message=["']([^"']+)["']|message=([^ ]+)/i);
        if (msgMatch) {
          updates.messageText = msgMatch[1] || msgMatch[2];
        }

        const canvasMatch = paramStr.match(/canvas=(on|off|true|false|enable|disable)/i);
        if (canvasMatch) {
          const val = canvasMatch[1].toLowerCase();
          updates.canvasEnabled = val === "on" || val === "true" || val === "enable";
        }

        const bgMatch = paramStr.match(/bg=(https?:\/\/[^\s]+|reset|default)/i);
        if (bgMatch) {
          const val = bgMatch[1].toLowerCase();
          updates.canvasBgUrl = (val === "reset" || val === "default") ? null : bgMatch[1];
        }

        const roleMatch = paramStr.match(/role=(<@&(\d+)>|(\d+)|off)/i);
        if (roleMatch) {
          if (roleMatch[1].toLowerCase() === "off") {
            updates.autoRoleId = null;
          } else {
            const rId = roleMatch[2] || roleMatch[3];
            if (message.guild.roles.cache.has(rId)) updates.autoRoleId = rId;
          }
        }

        if (Object.keys(updates).length > 0) {
          welcomeManager.updateGuildWelcome(message.guild.id, updates);
          const container = new ContainerBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `### 🛠️ Welcome Settings Batch Updated!\n` +
              `-# *Applied key settings updates successfully.*\n\n` +
              Object.entries(updates)
                .map(([key, val]) => `> - **${key}:** \`${val}\``)
                .join("\n")
            )
          );
          return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        }
      }

      // Display interactive menu and guidance for editing all parameters
      const config = welcomeManager.getGuildWelcome(message.guild.id);
      const mainContent =
        `# 🛠️ Welcome System Multi-Editor Guide\n` +
        `-# *Quick commands to edit all welcome components individually or in batch.*\n\n` +
        `### 📌 Individual Editor Commands:\n` +
        `> - **.welcome enable / .welcome disable** — Toggle entire welcome module\n` +
        `> - **.welcome channel #channel** — Set welcome text channel\n` +
        `> - **.welcome message <text>** — Set greeting message text\n` +
        `> - **.welcome card <on|off>** — Enable or disable canvas image card\n` +
        `> - **.welcome bg <image_url|reset>** — Set custom canvas background URL\n` +
        `> - **.welcome autorole <@Role|off>** — Set or clear automatic join role\n` +
        `> - **.welcome joindm <on|off|text>** — Configure private greeting DM\n` +
        `> - **.welcome reset** — Reset configuration to factory defaults\n\n` +
        `### ⚡ Batch Inline Edit Usage:\n` +
        `\`\`\`\n.welcome edit channel=#welcome message="Hello {user}!" canvas=on bg=https://i.imgur.com/example.png role=@Member\n\`\`\``;

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(mainContent)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: CHANNEL
    // -------------------------------------------------------------
    if (sub === "channel") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if (!channel) {
        return message.reply("❌ Please mention a valid text channel! Example: `.welcome channel #welcome`").catch(() => null);
      }
      welcomeManager.updateGuildWelcome(message.guild.id, { channelId: channel.id, enabled: true });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ Welcome Channel Updated\n` +
          `-# *Greetings are now active in ${channel}.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: MESSAGE / MSG
    // -------------------------------------------------------------
    if (sub === "message" || sub === "msg") {
      const arg1 = args[1]?.toLowerCase();

      if (arg1 === "off" || arg1 === "disable" || arg1 === "false") {
        welcomeManager.updateGuildWelcome(message.guild.id, { messageEnabled: false });
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⚠️ Welcome Text Message Disabled\n` +
            `-# *Text greeting messages are now **DISABLED**.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      if (arg1 === "on" || arg1 === "enable" || arg1 === "true") {
        welcomeManager.updateGuildWelcome(message.guild.id, { messageEnabled: true });
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ Welcome Text Message Enabled\n` +
            `-# *Text greeting messages are now **ENABLED**.*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      const text = args.slice(1).join(" ");
      if (!text) {
        const config = welcomeManager.getGuildWelcome(message.guild.id);
        return message.reply(
          `ℹ️ Welcome message status: **${config.messageEnabled ? "ENABLED" : "DISABLED"}**.\n` +
          `Use \`.welcome message off\` / \`.welcome message on\` or \`.welcome message <template>\`.`
        ).catch(() => null);
      }

      welcomeManager.updateGuildWelcome(message.guild.id, { messageText: text, messageEnabled: true });
      const previewText = welcomeManager.formatWelcomeText(text, message.author, message.guild);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ Welcome Message Template Saved\n\n` +
          `> **Raw:** \`${text}\` \n\n` +
          `> **Live Output:** ${previewText}`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: CARD / CANVAS
    // -------------------------------------------------------------
    if (sub === "card" || sub === "canvas") {
      const stateArg = args[1]?.toLowerCase();
      if (stateArg === "on" || stateArg === "enable" || stateArg === "true") {
        welcomeManager.updateGuildWelcome(message.guild.id, { canvasEnabled: true });
        return message.reply("✅ Welcome canvas image card has been **ENABLED**.").catch(() => null);
      } else if (stateArg === "off" || stateArg === "disable" || stateArg === "false") {
        welcomeManager.updateGuildWelcome(message.guild.id, { canvasEnabled: false });
        return message.reply("✅ Welcome canvas image card has been **DISABLED**.").catch(() => null);
      }
      const config = welcomeManager.getGuildWelcome(message.guild.id);
      return message.reply(`ℹ️ Welcome canvas card is currently **${config.canvasEnabled ? "ENABLED" : "DISABLED"}**. Use \`.welcome card <on|off>\` to toggle.`).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: BG / BACKGROUND
    // -------------------------------------------------------------
    if (sub === "bg" || sub === "background") {
      const urlArg = args[1];
      if (!urlArg) {
        return message.reply("❌ Please provide an image URL or `reset`! Example: `.welcome bg https://example.com/banner.png`").catch(() => null);
      }
      if (urlArg.toLowerCase() === "reset" || urlArg.toLowerCase() === "none") {
        welcomeManager.updateGuildWelcome(message.guild.id, { canvasBgUrl: null });
        return message.reply("✅ Welcome card background reset to default.").catch(() => null);
      }
      if (!urlArg.startsWith("http://") && !urlArg.startsWith("https://")) {
        return message.reply("❌ Invalid image URL! Must start with http:// or https://").catch(() => null);
      }
      welcomeManager.updateGuildWelcome(message.guild.id, { canvasBgUrl: urlArg, canvasEnabled: true });
      return message.reply(`✅ Welcome card background URL updated to: ${urlArg}`).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: AUTOROLE
    // -------------------------------------------------------------
    if (sub === "autorole" || sub === "role") {
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
      if (args[1]?.toLowerCase() === "off" || args[1]?.toLowerCase() === "disable" || args[1]?.toLowerCase() === "none") {
        welcomeManager.updateGuildWelcome(message.guild.id, { autoRoleId: null });
        return message.reply("✅ Auto-role on join has been **DISABLED**.").catch(() => null);
      }
      if (!role) {
        return message.reply("❌ Please mention a valid role or use `off`! Example: `.welcome autorole @Member`").catch(() => null);
      }
      welcomeManager.updateGuildWelcome(message.guild.id, { autoRoleId: role.id });
      return message.reply(`✅ Auto-role on join set to ${role}.`).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: JOINDM
    // -------------------------------------------------------------
    if (sub === "joindm") {
      const arg1 = args[1]?.toLowerCase();
      if (arg1 === "test") {
        const testCmd = client.messageCommands?.get("joindmtest") || require("./joindmtest");
        if (testCmd) {
          return testCmd.execute(client, message, args);
        }
      }
      if (arg1 === "on" || arg1 === "enable") {
        welcomeManager.updateGuildWelcome(message.guild.id, { joinDmEnabled: true });
        return message.reply("✅ Direct Message greetings on join have been **ENABLED**.").catch(() => null);
      }
      if (arg1 === "off" || arg1 === "disable") {
        welcomeManager.updateGuildWelcome(message.guild.id, { joinDmEnabled: false });
        return message.reply("✅ Direct Message greetings on join have been **DISABLED**.").catch(() => null);
      }
      const text = args.slice(1).join(" ");
      if (text) {
        welcomeManager.updateGuildWelcome(message.guild.id, { joinDmEnabled: true, joinDmText: text });
        return message.reply(`✅ Join DM enabled and message set to: \`${text}\``).catch(() => null);
      }
      const config = welcomeManager.getGuildWelcome(message.guild.id);
      return message.reply(`ℹ️ Join DM state: **${config.joinDmEnabled ? "ENABLED" : "DISABLED"}**. DM text: \`${config.joinDmText}\``).catch(() => null);
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: TEST
    // -------------------------------------------------------------
    if (sub === "test") {
      const welcometestCmd = client.messageCommands?.get("welcometest") || require("./welcometest");
      if (welcometestCmd) {
        return welcometestCmd.execute(client, message, args);
      }
    }

    // -------------------------------------------------------------
    // SUBCOMMAND: CARDCONFIG / STUDIO
    // -------------------------------------------------------------
    if (sub === "cardconfig" || sub === "studio") {
      const { buildCardConfigPayload } = require("../../lib/welcome/handleWelcomeCanvasInteraction");
      const payload = await buildCardConfigPayload(message.member || message.author);
      return message.reply(payload).catch(() => null);
    }

    // -------------------------------------------------------------
    // DEFAULT MAIN DASHBOARD
    // -------------------------------------------------------------
    const config = welcomeManager.getGuildWelcome(message.guild.id);
    const channelMention = config.channelId ? `<#${config.channelId}>` : "`None`";
    const roleMention = config.autoRoleId ? `<@&${config.autoRoleId}>` : "`None`";

    const astrixPath = path.join(__dirname, "../../assets/astrix.png");
    const bannerAttachment = new AttachmentBuilder(astrixPath, {
      name: "astrix.png",
    });

    const mediaItem = new MediaGalleryItemBuilder().setURL(
      "attachment://astrix.png",
    );
    const mediaGallery = new MediaGalleryBuilder().addItems(mediaItem);

    const websiteButton = new ButtonBuilder()
      .setEmoji("<:website:1528304906400960582>")
      .setLabel("Website")
      .setStyle(ButtonStyle.Link)
      .setURL("https://extremez.vercel.app/");

    const supportButton = new ButtonBuilder()
      .setEmoji("<:discord:1527683374523744367>")
      .setLabel("Support")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/FR9pXG2Mwb");

    const row = new ActionRowBuilder().addComponents(websiteButton, supportButton);

    const mainContent =
      `# <:astrix:1527205612205903973> Welcome & Join Engine Dashboard\n` +
      `-# *Configure automatic member greetings, roles, canvas cards, and join DMs.*\n\n` +
      `<:list:1528313871889334382> **Configuration Overview**\n` +
      `> -# <:prefix:1528309903972892772> **Status:** \`${config.enabled ? "ENABLED" : "DISABLED"}\`\n` +
      `> -# <:servers:1528311514065535007> **Welcome Channel:** ${channelMention}\n` +
      `> -# <:members:1528311049726591006> **Auto-Role:** ${roleMention}\n` +
      `> -# <:clock:1528312173275906088> **Canvas Card:** \`${config.canvasEnabled ? "ENABLED" : "DISABLED"}\`\n` +
      `> -# <:clock:1528312173275906088> **Join DM:** \`${config.joinDmEnabled ? "ENABLED" : "DISABLED"}\`\n\n` +
      `> **Available Commands & Subcommands:**\n` +
      `> - \`.welcome enable\` — Activate greeting module\n` +
      `> - \`.welcome disable\` — Deactivate greeting module\n` +
      `> - \`.welcome config\` — Display full parameter config & preview\n` +
      `> - \`.welcome reset\` — Reset all settings to factory default\n` +
      `> - \`.welcome edit\` — Multi-option editor guide and batch command\n` +
      `> - \`.welcome channel #channel\` — Set greeting channel\n` +
      `> - \`.welcome message <text>\` — Set welcome message template\n` +
      `> - \`.welcome card <on|off>\` — Toggle canvas image card\n` +
      `> - \`.welcome bg <url|reset>\` — Set custom card background\n` +
      `> - \`.welcome autorole <@Role|off>\` — Assign auto-role on join\n` +
      `> - \`.welcome joindm <on|off|text>\` — Configure private join DM\n` +
      `> - \`.welcome test\` — Send live preview test card`;

    const footerText = `-# Built with <a:Red_heart:1528312958541631578> by ASTRIXCODE™ • © 2026 ASTRIXCODE`;

    const container = new ContainerBuilder()
      .addMediaGalleryComponents(mediaGallery)
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(mainContent),
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(footerText),
      )
      .addActionRowComponents(row);

    return message.reply({
      components: [container],
      files: [bannerAttachment],
      flags: MessageFlags.IsComponentsV2,
    }).catch(() => null);
  },
};
