const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["qrcode", "qr"],
  category: "Utility",
  desc: "Generate a downloadable QR Code image from a URL or text string.",
  botPermissions: ["AttachFiles"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const text = args.join(" ");

    if (!text) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📱 QR Code Generator\n` +
          `-# *Convert text or URLs into QR Codes.*\n\n` +
          `> - **Usage:** \`.qr <text or url>\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📱 QR Code Generated\n` +
        `-# *Scan the QR code image below to open link or view text.*\n\n` +
        `> - **Data:** \`${text.length > 50 ? text.slice(0, 47) + "..." : text}\` \n` +
        `> - **Image URL:** [Direct QR Link](${qrUrl})`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
