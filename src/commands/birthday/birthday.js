const {
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
  alias: ["birthday", "bday", "bd"],
  category: "Birthday",
  desc: "Register your birthday, view upcoming birthdays, and manage server birthday wishes.",
  botPermissions: ["Administrator"],
  userPermissions: [],
  devOnly: false,

  async execute(client, message, args) {
    if (!message.guild) return;

    const guildId = message.guild.id;
    const config = birthdayManager.getGuildBirthday(guildId);
    const subcommand = args[0]?.toLowerCase();

    const isAdmin = message.member.permissions.has(PermissionFlagsBits.ManageGuild) || message.member.permissions.has(PermissionFlagsBits.Administrator);

    // Channel restriction check for non-admins
    if (config.commandChannel && message.channel.id !== config.commandChannel && !isAdmin) {
      return message.reply({
        components: [
          buildErrorNotice(
            "Wrong Channel",
            `Birthday commands can only be used in <#${config.commandChannel}>.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Default or Setup / Config: Admin Panel
    if (subcommand === "setup" || subcommand === "config" || subcommand === "panel") {
      if (!isAdmin) {
        return message.reply({
          components: [buildErrorNotice("Access Denied", "You need **Manage Server** permission to configure Birthday settings.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const panel = buildBirthdayContainer(config);
      return message.reply({
        components: [panel],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Manual Admin Trigger Check (.birthday check)
    if (subcommand === "check") {
      if (!isAdmin) {
        return message.reply({
          components: [buildErrorNotice("Access Denied", "You need **Manage Server** permission.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      if (!config.enabled || !config.wishChannel) {
        return message.reply({
          components: [buildErrorNotice("Not Configured", "Birthday system is not enabled or wish channel is not set. Use `.birthday setup` first.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const wishedCount = await triggerBirthdayCheckGuild(client, message.guild, true);
      return message.reply({
        components: [
          buildSuccessNotice(
            "Birthday Check Complete",
            wishedCount > 0 ? `Wished **${wishedCount}** member(s) happy birthday!` : `No members have a birthday today.`
          ),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Set Birthday Subcommand (.birthday set DD/MM)
    if (subcommand === "set") {
      const dateInput = args[1];
      if (!dateInput) {
        return message.reply({
          components: [buildErrorNotice("Invalid Usage", "Usage: `.birthday set DD/MM` (e.g. `.birthday set 25/12`)")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const parts = dateInput.split(/[\/\-\.]/);
      if (parts.length !== 2) {
        return message.reply({
          components: [buildErrorNotice("Invalid Format", "Use DD/MM format (e.g. `25/12` for December 25th)")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);

      if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 1 || month > 12) {
        return message.reply({
          components: [buildErrorNotice("Invalid Date", "Please provide a valid date (DD/MM)")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (day > daysInMonth[month - 1]) {
        return message.reply({
          components: [buildErrorNotice("Invalid Date", `Month ${month} doesn't have ${day} days.`)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      birthdayManager.setBirthday(guildId, message.author.id, day, month);
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      return message.reply({
        components: [buildSuccessNotice("Birthday Set", `Your birthday has been set to **${day} ${monthNames[month - 1]}** 🎂`)],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // View Birthday Subcommand (.birthday view [@user])
    if (subcommand === "view" || (!subcommand && message.mentions.users.size > 0)) {
      const targetUser = message.mentions.users.first() || message.author;
      const birthday = birthdayManager.getBirthday(guildId, targetUser.id);

      if (!birthday) {
        const notSetMsg = targetUser.id === message.author.id
          ? "You haven't set your birthday yet. Use `.birthday set DD/MM`"
          : `${targetUser.username} hasn't registered their birthday.`;
        return message.reply({
          components: [buildErrorNotice("No Birthday Registered", notSetMsg)],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
      }

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const container = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🎂 **${targetUser.username}'s Birthday**`))
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`📅 **${birthday.day} ${monthNames[birthday.month - 1]}**`));

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Upcoming Birthdays Subcommand (.birthday upcoming)
    if (subcommand === "upcoming") {
      const upcoming = birthdayManager.getUpcomingBirthdays(guildId, 10);
      if (upcoming.length === 0) {
        return message.reply({
          components: [buildErrorNotice("No Upcoming Birthdays", "No members have birthdays in the next 30 days.")],
          flags: MessageFlags.IsComponentsV2,
          allowedMentions: { repliedUser: false },
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

      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Remove Birthday Subcommand (.birthday remove)
    if (subcommand === "remove" || subcommand === "delete") {
      const removed = birthdayManager.removeBirthday(guildId, message.author.id);
      return message.reply({
        components: [
          removed
            ? buildSuccessNotice("Birthday Removed", "Your birthday has been removed.")
            : buildErrorNotice("No Birthday Set", "You haven't set a birthday to remove."),
        ],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { repliedUser: false },
      }).catch(() => null);
    }

    // Default Command Help Reference
    const helpContainer = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `### ${EMOJIS.tada || "🎂"} BIRTHDAY COMMAND REFERENCE\n` +
          `> - \`.birthday set DD/MM\` - Set your birthday (e.g. \`.birthday set 25/12\`)\n` +
          `> - \`.birthday view [@user]\` - View registered birthday\n` +
          `> - \`.birthday upcoming\` - View upcoming server birthdays\n` +
          `> - \`.birthday remove\` - Remove your birthday\n` +
          (isAdmin ? `> - \`.birthday setup\` - Admin setup & control panel\n> - \`.birthday check\` - Manual wish trigger check` : "")
      )
    );

    return message.reply({
      components: [helpContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { repliedUser: false },
    }).catch(() => null);
  },
};
