const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const birthdayManager = require("../../lib/birthdayManager");
const { buildBirthdayContainer, buildBirthdayWishCard } = require("../../lib/security/handleBirthdayInteraction");
const { triggerBirthdayCheckGuild } = require("../../listeners/onBirthdayScheduler");
const EMOJIS = require("../../lib/emojis");

function buildSuccessNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.ticky_red || "✅"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

function buildErrorNotice(title, description) {
  return new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`### ${EMOJIS.cross || "❌"} ${title}`)
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    )
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
}

module.exports = {
  name: "birthday",
  category: "Birthday",
  description: "Register your birthday, view upcoming birthdays, and manage server birthday wishes.",
  type: ApplicationCommandType.ChatInput,
  botPermissions: ["Administrator"],
  userPermissions: [],
  devOnly: false,

  options: [
    {
      name: "set",
      description: "Set your birthday date (DD/MM).",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "day",
          description: "Day of the month (1-31).",
          type: ApplicationCommandOptionType.Integer,
          required: true,
          minValue: 1,
          maxValue: 31,
        },
        {
          name: "month",
          description: "Month of the year (1-12).",
          type: ApplicationCommandOptionType.Integer,
          required: true,
          minValue: 1,
          maxValue: 12,
        },
      ],
    },
    {
      name: "view",
      description: "View a member's birthday.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "Target user (defaults to you).",
          type: ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    },
    {
      name: "upcoming",
      description: "View upcoming server birthdays in next 30 days.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "remove",
      description: "Remove your registered birthday.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "setup",
      description: "Open the interactive Birthday system control dashboard (Admin).",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "check",
      description: "Manually trigger birthday wish check (Admin).",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  async execute(client, interaction) {
    if (!interaction.guild) return;

    const guildId = interaction.guild.id;
    const config = birthdayManager.getGuildBirthday(guildId);
    const subcommand = interaction.options.getSubcommand();
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (config.commandChannel && interaction.channel.id !== config.commandChannel && !isAdmin) {
      return interaction.reply({
        components: [buildErrorNotice("Wrong Channel", `Birthday commands can only be used in <#${config.commandChannel}>.`)],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      }).catch(() => null);
    }

    if (subcommand === "setup") {
      if (!isAdmin) {
        return interaction.reply({
          components: [buildErrorNotice("Access Denied", "You need **Manage Server** permission.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const panel = buildBirthdayContainer(config);
      return interaction.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "check") {
      if (!isAdmin) {
        return interaction.reply({
          components: [buildErrorNotice("Access Denied", "You need **Manage Server** permission.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      if (!config.enabled || !config.wishChannel) {
        return interaction.reply({
          components: [buildErrorNotice("Not Configured", "Birthday system is not enabled or wish channel not set.")],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const wishedCount = await triggerBirthdayCheckGuild(client, interaction.guild, true);
      return interaction.reply({
        components: [
          buildSuccessNotice(
            "Birthday Check Complete",
            wishedCount > 0 ? `Wished **${wishedCount}** member(s) happy birthday!` : `No members have a birthday today.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "set") {
      const day = interaction.options.getInteger("day");
      const month = interaction.options.getInteger("month");

      const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (day > daysInMonth[month - 1]) {
        return interaction.reply({
          components: [buildErrorNotice("Invalid Date", `Month ${month} doesn't have ${day} days.`)],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      birthdayManager.setBirthday(guildId, interaction.user.id, day, month);
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      return interaction.reply({
        components: [buildSuccessNotice("Birthday Set", `Your birthday has been set to **${day} ${monthNames[month - 1]}** 🎂`)],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "view") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const birthday = birthdayManager.getBirthday(guildId, targetUser.id);

      if (!birthday) {
        const notSetMsg = targetUser.id === interaction.user.id
          ? "You haven't registered your birthday yet. Use `/birthday set`"
          : `${targetUser.username} hasn't registered their birthday.`;
        return interaction.reply({
          components: [buildErrorNotice("No Birthday Registered", notSetMsg)],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => null);
      }

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🎂 **${targetUser.username}'s Birthday**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`📅 **${birthday.day} ${monthNames[birthday.month - 1]}**`));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "upcoming") {
      const upcoming = birthdayManager.getUpcomingBirthdays(guildId, 10);
      if (upcoming.length === 0) {
        return interaction.reply({
          components: [buildErrorNotice("No Upcoming Birthdays", "No members have birthdays in the next 30 days.")],
          flags: MessageFlags.IsComponentsV2,
        }).catch(() => null);
      }

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const listText = upcoming
        .map((item, i) => {
          const daysText = item.daysUntil === 0 ? "**Today!**" : item.daysUntil === 1 ? "Tomorrow" : `in ${item.daysUntil} days`;
          return `\`${i + 1}.\` <@${item.userId}> - ${item.day} ${monthNames[item.month - 1]} (${daysText})`;
        })
        .join("\n");

      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🎂 **UPCOMING BIRTHDAYS (Next 30 Days)**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(listText));

      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }

    if (subcommand === "remove") {
      const removed = birthdayManager.removeBirthday(guildId, interaction.user.id);
      return interaction.reply({
        components: [
          removed
            ? buildSuccessNotice("Birthday Removed", "Your birthday has been removed.")
            : buildErrorNotice("No Birthday Set", "You haven't registered a birthday to remove."),
        ],
        flags: MessageFlags.IsComponentsV2,
      }).catch(() => null);
    }
  },
};
