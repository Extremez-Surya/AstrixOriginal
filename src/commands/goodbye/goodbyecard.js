const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyecard", "leavecard", "goodbyecanvas", "leavecanvas"],
  category: "Goodbye",
  desc: "Configure goodbye canvas image card toggle and background image.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();
    const config = goodbyeManager.getGuildGoodbye(message.guild.id);

    if (sub === "on" || sub === "enable" || sub === "true") {
      if (config.channels) {
        for (const ch of config.channels) {
          ch.canvasEnabled = true;
        }
        goodbyeManager.updateGuildGoodbye(message.guild.id, { channels: config.channels });
      }
      return message.reply("✅ Goodbye canvas image card has been **ENABLED**.").catch(() => null);
    }

    if (sub === "off" || sub === "disable" || sub === "false") {
      if (config.channels) {
        for (const ch of config.channels) {
          ch.canvasEnabled = false;
        }
        goodbyeManager.updateGuildGoodbye(message.guild.id, { channels: config.channels });
      }
      return message.reply("✅ Goodbye canvas image card has been **DISABLED**.").catch(() => null);
    }

    if (sub === "bg" || sub === "background") {
      const urlArg = args[1];
      if (!urlArg) {
        return message.reply("❌ Please provide an image URL or `reset`! Example: `.goodbyecard bg https://example.com/image.png`").catch(() => null);
      }
      if (urlArg.toLowerCase() === "reset" || urlArg.toLowerCase() === "none") {
        if (config.channels) {
          for (const ch of config.channels) {
            ch.canvasBgUrl = null;
          }
          goodbyeManager.updateGuildGoodbye(message.guild.id, { channels: config.channels });
        }
        return message.reply("✅ Goodbye card background reset to default.").catch(() => null);
      }
      if (!urlArg.startsWith("http://") && !urlArg.startsWith("https://")) {
        return message.reply("❌ Invalid image URL! Must start with http:// or https://").catch(() => null);
      }
      if (config.channels) {
        for (const ch of config.channels) {
          ch.canvasBgUrl = urlArg;
          ch.canvasEnabled = true;
        }
        goodbyeManager.updateGuildGoodbye(message.guild.id, { channels: config.channels });
      }
      return message.reply(`✅ Goodbye card background URL updated to: ${urlArg}`).catch(() => null);
    }

    const firstCh = config.channels && config.channels[0];
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🖼️ Goodbye Canvas Image Card Settings\n` +
        `-# *Configure visual image banners for member departures.*\n\n` +
        `> - **Canvas Card State:** \`${firstCh?.canvasEnabled !== false ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
        `> - **Background Image:** ${firstCh?.canvasBgUrl ? `[Custom Image](${firstCh.canvasBgUrl})` : "`Default Dark Gradient`"}\n\n` +
        `> **Usage:**\n` +
        `> - \`.goodbyecard on\` — Enable canvas card\n` +
        `> - \`.goodbyecard off\` — Disable canvas card\n` +
        `> - \`.goodbyecard bg <url>\` — Set custom background image URL\n` +
        `> - \`.goodbyecard bg reset\` — Reset to default background`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
