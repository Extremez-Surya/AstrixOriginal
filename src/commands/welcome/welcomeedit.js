const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomeedit", "editwelcome", "welcomeeditall"],
  category: "Welcome",
  desc: "Edit all welcome system settings individually or via inline parameters.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const paramStr = args.join(" ");

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

    const mainContent =
      `# 🛠️ Welcome System Editor & Guide\n` +
      `-# *Quick commands to edit all welcome components individually or in batch.*\n\n` +
      `### 📌 Individual Editor Commands:\n` +
      `> - **.welcomechannel #channel** — Set welcome text channel\n` +
      `> - **.welcomemessage <text>** — Set greeting message text\n` +
      `> - **.welcomecard <on|off>** — Enable or disable canvas image card\n` +
      `> - **.welcomecard bg <url|reset>** — Set custom canvas background URL\n` +
      `> - **.autoroleset <@Role>** — Set automatic join role\n` +
      `> - **.joindmenable <text>** — Configure private greeting DM\n` +
      `> - **.welcomereset** — Reset configuration to factory defaults\n\n` +
      `### ⚡ Batch Edit Usage:\n` +
      `\`\`\`\n.welcomeedit channel=#welcome message="Hello {user}!" canvas=on bg=https://i.imgur.com/example.png role=@Member\n\`\`\``;

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(mainContent)
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
