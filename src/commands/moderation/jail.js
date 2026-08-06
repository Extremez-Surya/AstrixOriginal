const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["jail", "unjail", "jailsetup"],
  category: "Moderation",
  desc: "Restrict members to a isolated jail channel by removing their normal roles.",
  botPermissions: ["ManageRoles", "ManageChannels"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const action = message.content.slice(1).split(" ")[0].toLowerCase();
    const targetUser =
      message.mentions.users.first() ||
      (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (action === "jail") {
      if (!targetUser) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Target Required\n` +
            `-# *Usage: \`.jail @user [reason]\`*`
          )
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      const reason = args.slice(1).join(" ") || "No reason specified.";
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔒 Member JAILED\n` +
          `-# *${targetUser.username} has been isolated to the jail channel.*\n\n` +
          `> - **User:** ${targetUser} (\`${targetUser.id}\`)\n` +
          `> - **Reason:** \`${reason}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (action === "unjail") {
      if (!targetUser) {
        return message.reply("Specify user to unjail: `.unjail @user`");
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🔓 Member UNJAILED\n` +
          `-# *${targetUser.username}'s roles have been restored.*\n\n` +
          `> - **User:** ${targetUser} (\`${targetUser.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🔒 Jail System Management\n` +
        `-# *Isolate problematic users without banning them.*\n\n` +
        `> - **Usage:** \`.jail @user [reason]\` | \`.unjail @user\` | \`.jailsetup #jail-channel @JailRole\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
