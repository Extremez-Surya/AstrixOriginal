const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require("discord.js");

module.exports = {
  alias: ["fun", "8ball", "coinflip", "roll", "joke"],
  category: "Fun",
  desc: "Play quick fun commands like 8ball, coin flip, dice roll, or get jokes.",
  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const cmdName = message.content.slice(1).split(" ")[0].toLowerCase();

    if (cmdName === "8ball") {
      const question = args.join(" ");
      if (!question) return message.reply("Ask a question for the Magic 8-Ball.");
      const answers = [
        "It is certain.", "Without a doubt.", "Yes definitely.",
        "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
        "Don't count on it.", "My reply is no.", "Very doubtful."
      ];
      const answer = answers[Math.floor(Math.random() * answers.length)];
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎱 Magic 8-Ball\n\n` +
          `> - **Question:** \`${question}\` \n` +
          `> - **Answer:** \`${answer}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (cmdName === "coinflip" || cmdName === "flip") {
      const outcome = Math.random() > 0.5 ? "Heads" : "Tails";
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🪙 Coin Flip\n\n> - **Result:** \`${outcome}\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    if (cmdName === "roll" || cmdName === "dice") {
      const roll = Math.floor(Math.random() * 6) + 1;
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### 🎲 Dice Roll\n\n> - **You rolled:** \`${roll}\``)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### 🎲 Fun Commands Hub\n` +
        `-# *Entertainment and mini commands.*\n\n` +
        `> - **Commands:** \`.8ball <question>\` | \`.coinflip\` | \`.roll\` | \`.blackjack\` | \`.slots\` | \`.games\``
      )
    );
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
  },
};
