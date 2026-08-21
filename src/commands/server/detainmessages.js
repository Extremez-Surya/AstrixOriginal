const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const serverManager = require("../../lib/serverManager");

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["detainmessages", "detainmsg", "setdetainmsg"],
  category: "Server",
  desc: "Customize detention Direct Message, release, and response notification templates.",

  botPermissions: ["SendMessages"],
  userPermissions: ["ManageGuild"],
  devOnly: false,

  async execute(client, message, args) {
    const isOwner = message.author.id === message.guild.ownerId;
    const isManager = message.member.permissions.has("ManageGuild") || message.member.permissions.has("Administrator");

    if (!isOwner && !isManager) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Permission Denied\n` +
            `-# *You need the Manage Server permission to configure detain templates.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    const action = args[0]?.toLowerCase();

    if (!action || action === "view") {
      const config = serverManager.getServerConfig(message.guild.id);
      const msgs = config.moderation.detainMessages || {};

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### 📝 Detain Notification Templates • ${message.guild.name}\n\n` +
              `**1. Detain DM:**\n\`\`\`\n${msgs.detain || "Default"}\n\`\`\`\n` +
              `**2. Release DM:**\n\`\`\`\n${msgs.release || "Default"}\n\`\`\`\n` +
              `**3. Channel Response:**\n\`\`\`\n${msgs.response || "Default"}\n\`\`\`\n` +
              `-# *Available Placeholders:* \`{user}\`, \`{duration}\`, \`{reason}\`, \`{moderator}\`, \`{server}\``,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `-# *Usage: \`.detainmessages set <detain|release|response> <message>\` or \`.detainmessages reset\`*`,
          ),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (action === "reset") {
      serverManager.resetDetainMessages(message.guild.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ Detain Templates Reset\n` +
            `-# *All detention messaging templates have been restored to defaults.*`,
        ),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }

    if (action === "set") {
      const type = args[1]?.toLowerCase();
      const validTypes = ["detain", "release", "response"];

      if (!type || !validTypes.includes(type)) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Invalid Template Type\n` +
              `-# *Valid types: \`detain\` (DM on detain), \`release\` (DM on release), \`response\` (Mod response)*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      const templateContent = args.slice(2).join(" ");
      if (!templateContent) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Missing Content\n` +
              `-# *Please provide the template message text.*\n\n` +
              `> - **Example:** \`.detainmessages set detain You have been detained in {server} for {duration}. Reason: {reason}\``,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { parse: [], repliedUser: false },
        });
      }

      serverManager.setDetainMessage(message.guild.id, type, templateContent);

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ✅ Detain Template Updated\n` +
              `> - **Type:** \`${type.toUpperCase()}\`\n` +
              `> - **Template:** \`${templateContent}\`\n` +
              `-# *New template is now active.*`,
          ),
        )
        .addSeparatorComponents(
          new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true),
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# *ASTRIXCODE™ Server Customization*`),
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      });
    }
  },
};
