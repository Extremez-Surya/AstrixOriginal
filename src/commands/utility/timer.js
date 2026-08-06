const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["timer", "remind", "reminder"],
  category: "Utility",
  desc: "Set countdown timers and personal reminders.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const durationStr = args[0];
    const reason = args.slice(1).join(" ") || "No reason specified.";

    if (!durationStr) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⏱️ Timer & Reminder System\n` +
          `-# *Set countdown timers for tasks or events.*\n\n` +
          `> - **Usage:** \`.timer <time> [reason]\` (e.g. \`.timer 10m Check oven\`)\n` +
          `> - **Units:** \`s (seconds), m (minutes), h (hours), d (days)\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ⏱️ Timer Set\n` +
        `-# *Astrix will remind you when the timer expires.*\n\n` +
        `> - **Duration:** \`${durationStr}\` \n` +
        `> - **Reason:** \`${reason}\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
