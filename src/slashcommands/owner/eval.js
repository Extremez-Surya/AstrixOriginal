const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const util = require("util");

module.exports = {
  name: "eval",
  category: "Owner",
  description: "Executes JavaScript code on the bot core (Bot Owner Only).",
  type: ApplicationCommandType.ChatInput,
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  options: [
    {
      name: "code",
      description: "JavaScript code string to evaluate.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  async execute(client, interaction) {
    if (!noprefixManager.isOwner(interaction.user.id, client)) {
      return interaction.reply({ content: "❌ Access Denied: Bot Owner command.", ephemeral: true }).catch(() => null);
    }

    const code = interaction.options.getString("code");

    try {
      let evaled = eval(code);
      if (evaled instanceof Promise) evaled = await evaled;

      let output = typeof evaled !== "string" ? util.inspect(evaled, { depth: 1 }) : evaled;

      const tokenRegex = new RegExp(client.token, "gi");
      output = output.replace(tokenRegex, "[REDACTED TOKEN]");

      if (output.length > 1800) {
        output = output.slice(0, 1800) + "... [Output Truncated]";
      }

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⚡ **EVAL OUTPUT**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`js\n${output}\n\`\`\``));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ❌ **EVAL ERROR**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`js\n${err.stack || err.message || err}\n\`\`\``));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
