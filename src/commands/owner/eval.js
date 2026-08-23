const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const noprefixManager = require("../../lib/noprefixManager");
const { sanitizeString, sanitizePayload } = require("../../lib/security/secretShield");
const util = require("util");

module.exports = {
  alias: ["eval", "ev", "e", "js", "execjs"],
  category: "Owner",
  desc: "Executes arbitrary JavaScript code on the Node.js runtime with minimal clean output.",
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

    const startTime = process.hrtime();

    const path = require("path");
    const rootDir = path.resolve(__dirname, "../../..");

    const smartRequire = (modulePath) => {
      if (typeof modulePath === "string") {
        if (modulePath.startsWith("./src/") || modulePath.startsWith("src/") || modulePath.startsWith("./")) {
          const resolvedRoot = path.resolve(rootDir, modulePath.replace(/^\.\//, ""));
          try {
            return require(resolvedRoot);
          } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") throw err;
          }
        }
      }
      return require(modulePath);
    };

    try {
      // Evaluate within a scoped context where process.env is guarded
      const evalFunction = new Function(
        "client",
        "message",
        "process",
        "require",
        `return (async () => { 
          const env = process.env;
          return ${code}; 
        })();`
      );

      let evaled = await evalFunction(
        client,
        message,
        {
          ...process,
          env: safeEnv,
        },
        smartRequire
      );

      const diffTime = process.hrtime(startTime);
      const executionMs = ((diffTime[0] * 1e9 + diffTime[1]) / 1e6).toFixed(2);

      let output = typeof evaled !== "string" ? util.inspect(evaled, { depth: 0 }) : evaled;

      // 🔒 Deep Multi-Layer Secret Sanitization
      output = sanitizeString(output);

      const type = typeof evaled;

      if (output.length > 1800) {
        output = output.slice(0, 1800) + "\n... [Truncated]";
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚡ **Eval Output** • \`${executionMs}ms\` • \`${type}\`\n` +
          `\`\`\`js\n${output || "undefined"}\n\`\`\``
        )
      );

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    } catch (err) {
      const diffTime = process.hrtime(startTime);
      const executionMs = ((diffTime[0] * 1e9 + diffTime[1]) / 1e6).toFixed(2);

      // Clean concise error without huge internal discord.js stack trace
      let errorText = err.message ? `${err.name || "Error"}: ${err.message}` : String(err);
      errorText = sanitizeString(errorText);

      const errorContainer = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ❌ **Eval Error** • \`${executionMs}ms\`\n` +
          `\`\`\`js\n${errorText}\n\`\`\``
        )
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
