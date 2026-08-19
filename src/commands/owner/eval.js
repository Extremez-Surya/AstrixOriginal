const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const util = require("util");

module.exports = {
  alias: ["eval", "ev", "e", "js"],
  category: "Owner",
  desc: "Executes arbitrary JavaScript code on the bot core.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Only Bot Owners can execute arbitrary code.").catch(() => null);
    }

    const code = args.join(" ");
    if (!code) {
      return message.reply("❌ Please provide JavaScript code to execute.").catch(() => null);
    }

    try {
      let evaled = eval(code);
      if (evaled instanceof Promise) evaled = await evaled;

      let output = typeof evaled !== "string" ? util.inspect(evaled, { depth: 1 }) : evaled;

      // Sensitive token redaction
      const tokenRegex = new RegExp(client.token, "gi");
      output = output.replace(tokenRegex, "[REDACTED TOKEN]");

      if (output.length > 1800) {
        output = output.slice(0, 1800) + "... [Output Truncated]";
      }

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⚡ **EVAL OUTPUT**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`js\n${output}\n\`\`\``));

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    } catch (err) {
      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ❌ **EVAL ERROR**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`js\n${err.stack || err.message || err}\n\`\`\``));

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }
  },
};
