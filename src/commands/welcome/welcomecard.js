const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomecard", "welcomecanvas", "setwelcomecard"],
  category: "Welcome",
  desc: "Configure welcome canvas image card toggle and background image.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === "on" || sub === "enable" || sub === "true") {
      welcomeManager.updateGuildWelcome(message.guild.id, { canvasEnabled: true });
      return message.reply("✅ Welcome canvas image card has been **ENABLED**.").catch(() => null);
    }

    if (sub === "off" || sub === "disable" || sub === "false") {
      welcomeManager.updateGuildWelcome(message.guild.id, { canvasEnabled: false });
      return message.reply("✅ Welcome canvas image card has been **DISABLED**.").catch(() => null);
    }

    if (sub === "bg" || sub === "background") {
      const urlArg = args[1];
      if (!urlArg) {
        return message.reply("❌ Please provide an image URL or `reset`! Example: `.welcomecard bg https://example.com/image.png`").catch(() => null);
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

    const config = welcomeManager.getGuildWelcome(message.guild.id);
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🖼️ Welcome Canvas Image Card Settings\n` +
        `-# *Configure visual image banners for member greetings.*\n\n` +
        `> - **Canvas Card State:** \`${config.canvasEnabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
        `> - **Background Image:** ${config.canvasBgUrl ? `[Custom Image](${config.canvasBgUrl})` : "`Default Dark Gradient`"}\n\n` +
        `> **Usage:**\n` +
        `> - \`.welcomecard on\` — Enable canvas card\n` +
        `> - \`.welcomecard off\` — Disable canvas card\n` +
        `> - \`.welcomecard bg <url>\` — Set custom background image URL\n` +
        `> - \`.welcomecard bg reset\` — Reset to default background`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
