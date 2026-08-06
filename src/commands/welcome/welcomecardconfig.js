const { buildCardConfigPayload } = require("../../lib/welcome/handleWelcomeCanvasInteraction");

module.exports = {
  alias: ["welcomecardconfig", "cardconfig", "canvasconfig", "welcomecardstudio"],
  category: "Welcome",
  desc: "Interactive Welcome Canvas Studio — customize templates, text colors (#ffffff), avatar shapes, background images & overlay text with live preview.",
  botPermissions: ["SendMessages", "AttachFiles"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    try {
      const payload = await buildCardConfigPayload(message.member || message.author);
      return message.reply(payload).catch((err) => {
        console.error("[welcomecardconfig] Reply error:", err);
      });
    } catch (err) {
      console.error("[welcomecardconfig] Execution error:", err);
      return message.reply("❌ Failed to render welcome card configuration studio. Please try again.").catch(() => null);
    }
  },
};
