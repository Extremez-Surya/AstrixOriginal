const {
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const pollManager = require("../../lib/pollManager");

module.exports = {
  name: "poll",
  alias: ["poll", "polls", "vote", "survey", "custompoll"],
  category: "General",
  description: "Community Poll Studio with interactive modal builder, dropdown voting, and unlimited options.",
  usage:
    ".poll (Open Poll Studio)\n" +
    '.poll "Question" "Option 1" "Option 2" ...\n' +
    ".poll Question | Option 1 | Option 2 | Option 3 ...\n" +
    ".poll list\n" +
    ".poll close <MessageID>\n" +
    ".poll delete <MessageID>",

  async execute(client, message, args) {
    if (!message.guild) return;

    const sub1 = args[0]?.toLowerCase();

    // 1. OPEN POLL STUDIO HOME (.poll / .poll studio / .poll panel)
    if (!args.length || sub1 === "studio" || sub1 === "panel" || sub1 === "builder") {
      const studioHome = pollManager.buildPollStudioHome(message.guild);
      return message.reply({
        components: [studioHome],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 2. LIST POLLS (.poll list)
    if (sub1 === "list" || sub1 === "active") {
      const listView = pollManager.buildPollStudioListView(message.guild);
      return message.reply({
        components: [listView],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // 3. CLOSE POLL (.poll close <MessageID>)
    if (sub1 === "close" || sub1 === "end" || sub1 === "finish") {
      const targetId = args[1]?.replace(/\D/g, "");
      if (!targetId) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.poll close <MessageID>`",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const pollData = pollManager.getPoll(targetId);
      if (!pollData) {
        return message.reply({
          content: "❌ Poll not found.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const isAuthor = message.author.id === pollData.authorId;
      const isAdmin =
        message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        message.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isAuthor && !isAdmin) {
        return message.reply({
          content: "❌ Only the poll creator or an administrator can close this poll.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      pollManager.closePoll(targetId);

      try {
        const channel = message.guild.channels.cache.get(pollData.channelId);
        if (channel) {
          const msg = await channel.messages.fetch(targetId).catch(() => null);
          if (msg) {
            const closedContainer = pollManager.buildPollContainer(pollData);
            await msg.edit({ components: [closedContainer], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
          }
        }
      } catch {}

      return message.reply({
        content: `🔒 Poll **\`${pollData.question.slice(0, 40)}\`** has been closed!`,
      }).catch(() => null);
    }

    // 4. DELETE POLL (.poll delete <MessageID>)
    if (sub1 === "delete" || sub1 === "remove" || sub1 === "del") {
      const targetId = args[1]?.replace(/\D/g, "");
      if (!targetId) {
        return message.reply({
          content: "⚠️ **Invalid Usage.**\n*Syntax:* `.poll delete <MessageID>`",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const pollData = pollManager.getPoll(targetId);
      if (!pollData) {
        return message.reply({
          content: "❌ Poll not found.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const isAuthor = message.author.id === pollData.authorId;
      const isAdmin =
        message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        message.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isAuthor && !isAdmin) {
        return message.reply({
          content: "❌ Only the poll creator or an administrator can delete this poll.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      pollManager.deletePoll(targetId);

      try {
        const channel = message.guild.channels.cache.get(pollData.channelId);
        if (channel) {
          const msg = await channel.messages.fetch(targetId).catch(() => null);
          if (msg) await msg.delete().catch(() => null);
        }
      } catch {}

      return message.reply({
        content: `🗑️ Poll has been deleted!`,
      }).catch(() => null);
    }

    // 5. DIRECT POLL CREATION (.poll "Question" "Option 1" "Option 2" ... or .poll Question | Opt1 | Opt2)
    let fullText = args.join(" ");
    let allowMulti = false;

    if (fullText.includes("--multi") || fullText.includes("--multiselect")) {
      allowMulti = true;
      fullText = fullText.replace(/--multiselect|--multi/gi, "").trim();
    }

    let question = "";
    let options = [];

    // Check for quoted arguments
    const matches = fullText.match(/"([^"]+)"/g);
    if (matches && matches.length >= 2) {
      question = matches[0].replace(/"/g, "").trim();
      options = matches.slice(1, 26).map((m) => m.replace(/"/g, "").trim());
    } else if (fullText.includes("|")) {
      const parts = fullText.split("|").map((p) => p.trim()).filter(Boolean);
      question = parts[0];
      options = parts.slice(1, 26);
    } else {
      // Single question => Default Yes / No
      question = fullText.trim();
      options = ["Yes", "No"];
    }

    if (!question || options.length < 2) {
      return message.reply({
        content:
          "⚠️ Please provide a question and at least 2 options.\n" +
          "*Example:* `.poll \"Best Game?\" \"Valorant\" \"GTA V\" \"Minecraft\" \"CS2\"`\n" +
          "*Or pipe syntax:* `.poll Best Game? | Valorant | GTA V | Minecraft | CS2`",
        flags: MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    const tempPoll = {
      messageId: "temp",
      guildId: message.guild.id,
      channelId: message.channel.id,
      question,
      options: options.map((opt, idx) => ({
        index: idx,
        label: opt,
        votes: new Set(),
      })),
      authorId: message.author.id,
      allowMulti,
      closed: false,
    };

    const container = pollManager.buildPollContainer(tempPoll);
    const menuRow = pollManager.buildPollDropdownMenu(tempPoll);
    if (menuRow) container.addActionRowComponents(menuRow);

    await message.delete().catch(() => null);

    const sentMessage = await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    }).catch((err) => {
      console.error("[PollCommand] Failed to send poll:", err);
      return null;
    });

    if (sentMessage) {
      pollManager.createCustomPoll(
        sentMessage.id,
        message.guild.id,
        message.channel.id,
        question,
        options,
        message.author.id,
        allowMulti
      );
    }
  },
};
