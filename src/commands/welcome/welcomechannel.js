const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const welcomeManager = require("../../lib/welcomeManager");

module.exports = {
  alias: ["welcomechannel", "setwelcomechannel"],
  category: "Welcome",
  desc: "Set the text channel for welcome greeting messages.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const channel = message.mentions.channels.first();

    if (!channel) {
      const config = welcomeManager.getGuildWelcome(message.guild.id);
      const current = config.channelId ? `<#${config.channelId}>` : "`None`";
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 👋 Welcome Channel Settings\n` +
          `-# *Select where new member greetings are posted.*\n\n` +
          `> - **Usage:** \`.welcomechannel #channel\` \n` +
          `> - **Current Channel:** ${current}`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    welcomeManager.updateGuildWelcome(message.guild.id, {
      enabled: true,
      channelId: channel.id,
    });

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ✅ Welcome Channel Updated\n` +
        `-# *Greetings are now active in ${channel}.*\n\n` +
        `> - **Target Channel:** ${channel} (\`${channel.id}\`)`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
