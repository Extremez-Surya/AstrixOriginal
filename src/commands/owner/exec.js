const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const { sanitizeString } = require("../../lib/security/secretShield");
const { exec } = require("child_process");

module.exports = {
  alias: ["exec", "terminal", "sh", "bash", "shell"],
  category: "Owner",
  desc: "Executes shell / terminal commands directly on the host machine.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Only Bot Owners can execute terminal shell commands.").catch(() => null);
    }

    const command = args.join(" ");
    if (!command) {
      return message.reply("❌ Please provide a terminal command: `.exec <command...>`").catch(() => null);
    }

    const startTime = Date.now();

    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      const elapsed = Date.now() - startTime;
      let output = stdout || stderr || (error ? error.message : "Command executed with no output.");

      // 🔒 Deep Multi-Layer Secret Sanitization
      output = sanitizeString(output);

      if (output.length > 1800) {
        output = output.slice(0, 1800) + "\n... [Output Truncated]";
      }

      const statusEmoji = error ? "❌" : "💻";
      const statusTitle = error ? "Terminal Command Failed" : "Terminal Execution Successful";

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${statusEmoji} **${statusTitle}**\n` +
            `-# *Executed in ${elapsed}ms • Command: \`${command.slice(0, 60)}\`*\n\n` +
            `\`\`\`sh\n${output}\n\`\`\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# Host Terminal Process Execution`)
        );

      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    });
  },
};
