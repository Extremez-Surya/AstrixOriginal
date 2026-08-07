const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");
const goodbyeManager = require("../../lib/goodbyeManager");

module.exports = {
  alias: ["goodbyedm", "leavedm"],
  category: "Goodbye",
  desc: "Configure direct message (DM) notifications when members leave the server.",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    const sub = args[0]?.toLowerCase();
    const config = goodbyeManager.getGuildGoodbye(message.guild.id);

    if (sub === "on" || sub === "enable" || sub === "true") {
      goodbyeManager.updateGuildGoodbye(message.guild.id, { leaveDmEnabled: true });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Leave DM Greetings Activated\n` +
          `-# *Departing members will now receive a direct message when leaving.*\n\n` +
          `> - **Current DM Template:** \`${config.leaveDmText}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (sub === "off" || sub === "disable" || sub === "false") {
      goodbyeManager.updateGuildGoodbye(message.guild.id, { leaveDmEnabled: false });
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ Leave DM Greetings Deactivated\n` +
          `-# *Direct message notifications on member departure are now DISABLED.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (sub === "message" || sub === "text" || sub === "msg") {
      const text = args.slice(1).join(" ");
      if (!text) {
        return message.reply("❌ Please provide a Leave DM message template!\n\n**Example:** `.goodbyedm message Goodbye {username} from {server}! We'll miss you.`").catch(() => null);
      }

      goodbyeManager.updateGuildGoodbye(message.guild.id, {
        leaveDmEnabled: true,
        leaveDmText: text,
      });

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ✅ Leave DM Template Updated\n` +
          `-# *Direct message leave notification template updated and enabled.*\n\n` +
          `> **New DM Template:**\n` +
          `\`\`\`\n${text}\n\`\`\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 📩 Leave DM Settings\n` +
        `-# *Configure direct message departure greetings for departing members.*\n\n` +
        `> - **Leave DM State:** \`${config.leaveDmEnabled ? "ENABLED 🟢" : "DISABLED 🔴"}\`\n` +
        `> - **DM Message Template:** \`${config.leaveDmText}\`\n\n` +
        `> **Usage:**\n` +
        `> - \`.goodbyedm enable\` — Enable Leave DM notifications\n` +
        `> - \`.goodbyedm disable\` — Disable Leave DM notifications\n` +
        `> - \`.goodbyedm message <text>\` — Set custom DM message template`
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
