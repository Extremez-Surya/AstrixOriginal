const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const { confirmAction } = require("../../utils/confirm.js");
const { getOrCreateMuteRole } = require("../../utils/muteHelper.js");

module.exports = {
  alias: ["mute", "tempmute"],
  category: "Moderation",
  desc: "Mute a member by assigning the Muted role.",
  botPermissions: ["ManageRoles", "MuteMembers"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Target User Required\n` +
          `-# *Please mention a user or provide a valid user ID to mute.*\n\n` +
          `> - **Usage:** \`.mute @user [reason]\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const member = await message.guild.members
      .fetch(targetUser.id)
      .catch(() => null);
    if (!member) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Member Not Found\n` +
          `-# *This user is not currently in this server.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (
      member.roles.highest.position >=
      message.guild.members.me.roles.highest.position
    ) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Hierarchy Check Failed\n` +
          `-# *I cannot mute this member (their highest role is higher than or equal to mine).*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const guild = message.guild;
    let muteRole;
    try {
      muteRole = await getOrCreateMuteRole(guild);
    } catch (err) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Mute Role Error\n` +
          `-# *The 'Muted' role does not exist, and I could not create it. Ensure my role is high enough and I have Manage Roles permission.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (member.roles.cache.has(muteRole.id)) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Member Already Muted\n` +
          `-# *<@${targetUser.id}> is already muted.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const reason = args.slice(1).join(" ") || "No reason provided.";

    await confirmAction({
      client,
      context: message,
      moderator: message.author,
      targetUser,
      actionName: "Mute",
      detailsText: `**Reason:** ${reason}`,
      onConfirm: async () => {
        await member.roles.add(muteRole, reason);
        if (member.voice.channel) {
          await member.voice.disconnect("User was muted").catch(() => {});
        }
      },
    });
  },
};
