const { buildGoodbyeCardConfigPayload } = require("../../lib/goodbye/handleGoodbyeCanvasInteraction");

module.exports = {
  alias: ["goodbyecardconfig", "goodbyeconfigstudio", "leavecardconfig", "goodbyecardstudio"],
  category: "Goodbye",
  desc: "Interactive Goodbye Canvas Studio — customize templates, text colors (#ffffff), avatar shapes, background images & overlay text with live preview.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    try {
      const payload = await buildGoodbyeCardConfigPayload(message.member || message.author);
      return message.reply(payload).catch((err) => {
        console.error("[goodbyecardconfig] Reply error:", err);
      });
    } catch (err) {
      console.error("[goodbyecardconfig] Execution error:", err);
      return message.reply("❌ Failed to render goodbye card configuration studio. Please try again.").catch(() => null);
    }
  },
};
