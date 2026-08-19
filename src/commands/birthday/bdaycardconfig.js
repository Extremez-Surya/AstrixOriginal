const { buildBdayCardConfigPayload } = require("../../lib/security/handleBirthdayCanvasInteraction");
const { PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["bdaycardconfig", "birthdaycardconfig", "bdaycard", "birthdaycard", "bdaystudio"],
  category: "Birthday",
  desc: "Interactive Birthday Canvas Studio — customize theme templates, avatar shapes, accent colors, BG images & quotes with live preview.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply("❌ You need **Manage Server** permission to use Birthday Card Studio.").catch(() => null);
    }

    try {
      const payload = await buildBdayCardConfigPayload(message.member || message.author);
      return message.reply(payload).catch((err) => {
        console.error("[bdaycardconfig] Reply error:", err);
      });
    } catch (err) {
      console.error("[bdaycardconfig] Execution error:", err);
      return message.reply("❌ Failed to render birthday card configuration studio. Please try again.").catch(() => null);
    }
  },
};
