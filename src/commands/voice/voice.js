const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["voice", "vcmute", "vcunmute", "vckick", "vcdeaf", "vcundeaf"],
  category: "Voice",
  desc: "Moderate members in voice channels (mute, deafen, disconnect, move).",
  botPermissions: ["MuteMembers", "DeafenMembers", "MoveMembers"],
  userPermissions: ["MuteMembers"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);

    const action = args[0]?.toLowerCase();

    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎙️ Voice Moderation Panel\n` +
          `-# *Manage connected voice channel members.*\n\n` +
          `> - **Usage:** \`.voice mute @user\` | \`.voice unmute @user\`\n` +
          `> - **Usage:** \`.voice deaf @user\` | \`.voice undeaf @user\`\n` +
          `> - **Usage:** \`.voice disconnect @user\` | \`.voice move @user #VC\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member || !member.voice.channel) {
      return message.reply("Target member is not connected to a voice channel.");
    }

    if (action === "mute") {
      await member.voice.setMute(true).catch(() => null);
    } else if (action === "unmute") {
      await member.voice.setMute(false).catch(() => null);
    } else if (action === "disconnect" || action === "kick") {
      await member.voice.disconnect().catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎙️ Voice Action Executed\n` +
        `-# *Voice state updated for ${targetUser.username}.*\n\n` +
        `> - **Action:** \`${action || "updated"}\` | **User:** ${targetUser}`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
