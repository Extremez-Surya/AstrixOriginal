const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["customrole", "cr", "friendrole"],
  category: "Utility",
  desc: "Create and customize personal vanity roles for server members.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const action = args[0]?.toLowerCase();

    if (action === "create") {
      const name = args.slice(1).join(" ");
      if (!name) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### <a:red_star:1528688099436003419> Role Name Required\n-# Usage: \`.customrole create <Role Name>\``)
        );
        return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
      }

      const role = await message.guild.roles.create({
        name,
        reason: `Custom role created by ${message.author.tag}`,
      }).catch(() => null);

      if (!role) {
        return message.reply("Failed to create role. Check permissions.");
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎨 Custom Role Created\n` +
          `-# *Role created and assigned successfully.*\n\n` +
          `> - **Role:** ${role} (\`${role.id}\`)`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎨 Custom Role Manager\n` +
        `-# *Personal role management system.*\n\n` +
        `> - **Usage:** \`.customrole create <name>\` | \`.customrole icon <role> <url>\` | \`.customrole color <role> <hex>\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
