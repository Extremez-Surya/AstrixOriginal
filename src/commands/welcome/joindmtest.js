const welcomeManager = require("../../lib/welcomeManager");
const { renderJoinDmMessage } = require("../../lib/welcome/welcomeBuilder");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  alias: ["joindmtest", "testjoindm", "dmwelcometest"],
  category: "Welcome",
  desc: "Send a live preview test of the Join DM message directly to your DMs.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const config = welcomeManager.getGuildWelcome(message.guild.id);

    try {
      const dmMsg = await renderJoinDmMessage(message.member || message.author, config);
      await message.author.send(dmMsg);

      const confirmEmbed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("✉️ Join DM Test Dispatched!")
        .setDescription(`> Live preview test of your **${config.joinDmType || "premade"}** Join DM has been sent to your Direct Messages!`);

      return message.reply({ embeds: [confirmEmbed] }).catch(() => null);
    } catch (err) {
      console.error("[joindmtest] Error sending test DM:", err);
      return message.reply("❌ Unable to send Join DM test. Please check if your DMs are open!").catch(() => null);
    }
  },
};
