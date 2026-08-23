const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const { sanitizeString, sanitizePayload } = require("../../lib/security/secretShield");
const util = require("util");

module.exports = {
  alias: ["eval", "ev", "e", "js", "execjs"],
  category: "Owner",
  desc: "Executes arbitrary JavaScript code on the Node.js runtime with execution timing and memory diff.",
  botPermissions: [],
  userPermissions: [],
  devOnly: true,

  async execute(client, message, args) {
    if (!noprefixManager.isOwner(message.author.id, client)) {
      return message.reply("❌ Access Denied: Only Bot Owners can execute arbitrary code.").catch(() => null);
    }

    const code = args.join(" ");
    if (!code) {
      return message.reply("❌ Please provide JavaScript code to execute: `.eval <code...>`").catch(() => null);
    }

    // 🔒 Security Shield: Wrap message.channel.send and message.reply during eval execution
    const originalChannelSend = message.channel.send.bind(message.channel);
    const originalMessageReply = message.reply.bind(message);

    message.channel.send = async function (options) {
      return originalChannelSend(sanitizePayload(options));
    };
    message.reply = async function (options) {
      return originalMessageReply(sanitizePayload(options));
    };

    // 🔒 Security Shield: Mask process.env sensitive keys in eval scope
    const SENSITIVE_ENV_KEYS = [
      "DISCORD_TOKEN",
      "TOKEN",
      "CLIENT_SECRET",
      "MONGO_URI",
      "DATABASE_URL",
      "LAVALINK_PASSWORD",
      "WEBHOOK_URL",
    ];

    const safeEnv = new Proxy(process.env, {
      get(target, prop) {
        if (typeof prop === "string") {
          const upper = prop.toUpperCase();
          if (
            SENSITIVE_ENV_KEYS.includes(upper) ||
            upper.includes("TOKEN") ||
            upper.includes("SECRET") ||
            upper.includes("PASS") ||
            upper.includes("AUTH")
          ) {
            return "[🔒 PROTECTED_SECRET_REDACTED]";
          }
        }
        return target[prop];
      },
    });

    const startMemory = process.memoryUsage().heapUsed;
    const startTime = process.hrtime();

    try {
      // Evaluate within a scoped context where process.env is guarded
      const evalFunction = new Function(
        "client",
        "message",
        "process",
        `return (async () => { 
          const env = process.env;
          return ${code}; 
        })();`
      );

      let evaled = await evalFunction(client, message, {
        ...process,
        env: safeEnv,
      });

      const diffTime = process.hrtime(startTime);
      const executionMs = ((diffTime[0] * 1e9 + diffTime[1]) / 1e6).toFixed(2);
      const memDiff = ((process.memoryUsage().heapUsed - startMemory) / 1024).toFixed(1);

      let output = typeof evaled !== "string" ? util.inspect(evaled, { depth: 1 }) : evaled;

      // 🔒 Deep Multi-Layer Secret Sanitization
      output = sanitizeString(output);

      const type = typeof evaled;

      if (output.length > 1800) {
        output = output.slice(0, 1800) + "\n... [Output Truncated]";
      }

      const container = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ⚡ **JavaScript REPL Execution**\n` +
            `-# *Type: \`${type}\` • Time: \`${executionMs}ms\` • Mem: \`${memDiff} KB\`*\n\n` +
            `\`\`\`js\n${output || "undefined"}\n\`\`\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Hardened Runtime • Evaluated <t:${Math.floor(Date.now() / 1000)}:R>`)
        );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    } catch (err) {
      const diffTime = process.hrtime(startTime);
      const executionMs = ((diffTime[0] * 1e9 + diffTime[1]) / 1e6).toFixed(2);

      let errorText = err.stack || err.message || String(err);
      errorText = sanitizeString(errorText);

      const errorContainer = new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ❌ **Evaluation Exception**\n` +
            `-# *Execution halted after ${executionMs}ms*\n\n` +
            `\`\`\`js\n${errorText}\n\`\`\``
          )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`-# ASTRIXCODE™ Runtime Error Trap`)
        );

      return message.reply({
        components: [errorContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    } finally {
      // Restore original methods
      message.channel.send = originalChannelSend;
      message.reply = originalMessageReply;
    }
  },
};
