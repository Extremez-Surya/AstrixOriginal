const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");
const { renderJoinDmMessage } = require("../../lib/welcome/welcomeBuilder");

module.exports = {
  alias: ["joindmtest", "testjoindm", "dmwelcometest"],
  category: "Welcome",
  desc: "Send a live preview test of the Join DM message directly to your DMs.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const config = welcomeManager.getGuildWelcome(message.guild.id);

    if (!config.joinDmEnabled) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ Join DM Not Active\n` +
          `-# Cannot preview Join DM: Module is currently **DISABLED**.\n\n` +
          `> Use \`.joindm\` or \`.welcome joindm\` to enable direct message greetings.`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    try {
      const dmMsg = await renderJoinDmMessage(message.member || message.author, config);
      await message.author.send(dmMsg);

      const confirmContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✉️ Join DM Test Dispatched\n` +
          `-# Live preview of your **${config.joinDmType || "premade"}** Join DM has been sent to your Direct Messages!`
        )
      );

      return message.reply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    } catch (err) {
      console.error("[joindmtest] Error sending test DM:", err);
      return message.reply("❌ Unable to send Join DM test. Please check if your DMs from server members are open!").catch(() => null);
    }
  },
};

