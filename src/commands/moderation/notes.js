const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const moderationManager = require("../../lib/moderationManager");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["notes", "note", "modnotes"],
  category: "Moderation",
  desc: "Manage private moderator notes on a member.",
  botPermissions: ["SendMessages"],
  userPermissions: ["ManageMessages"],
  devOnly: false,

  async execute(client, message, args) {
    const subCmd = args[0]?.toLowerCase();

    // 1. Add Note: .notes add @user <note text>
    if (subCmd === "add") {
      const targetUser = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      const noteText = targetUser ? args.slice(2).join(" ") : null;

      if (!targetUser || !noteText) {
        return message.reply("Usage: `.notes add @user <note_content>`");
      }

      const note = moderationManager.addNote(message.guild.id, targetUser.id, noteText, message.author.username);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Note Added ── ${targetUser.username}\n` +
          `-# *Note #${note.id} saved to member's record*\n\n` +
          `> - **Note:** "${note.content}"\n` +
          `> - **Added by:** \`${message.author.username}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // 2. Remove Note: .notes remove @user <noteId>
    if (subCmd === "remove" || subCmd === "delete") {
      const targetUser = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      const noteId = args[2];

      if (!targetUser || !noteId) {
        return message.reply("Usage: `.notes remove @user <noteId>`");
      }

      const removed = moderationManager.removeNote(message.guild.id, targetUser.id, noteId);
      if (!removed) {
        return message.reply(`❌ Note #${noteId} not found for ${targetUser.username}.`);
      }

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Note #${noteId} Removed\n` +
          `-# *Successfully deleted note from ${targetUser.username}'s record.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // 3. Clear Notes: .notes clear @user
    if (subCmd === "clear") {
      const targetUser = message.mentions.users.first() || (args[1] ? await client.users.fetch(args[1]).catch(() => null) : null);
      if (!targetUser) {
        return message.reply("Usage: `.notes clear @user`");
      }

      moderationManager.clearNotes(message.guild.id, targetUser.id);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} Notes Cleared\n` +
          `-# *All moderator notes wiped for ${targetUser.username}.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    // 4. View Notes: .notes @user
    const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);

    if (!targetUser) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📝 **Moderator Notes Help**\n` +
          `-# *Store private staff notes on server members*\n\n` +
          `> - **View Notes:** \`.notes @user\`\n` +
          `> - **Add Note:** \`.notes add @user <text>\`\n` +
          `> - **Remove Note:** \`.notes remove @user <noteId>\`\n` +
          `> - **Clear Notes:** \`.notes clear @user\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const notes = moderationManager.getNotes(message.guild.id, targetUser.id);

    if (notes.length === 0) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📝 No Notes ── ${targetUser.username}\n` +
          `-# *No moderator notes recorded for this user.*`
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const noteLines = notes.map((n) => {
      const ts = Math.floor(n.timestamp / 1000);
      return `> **#${n.id}** "${n.content}"\n` +
             `> - *Added by \`${n.moderator}\` <t:${ts}:R>*`;
    });

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 📝 **Moderator Notes** ── ${targetUser.username} (${notes.length})\n` +
          `-# *Confidential staff notes record*\n\n` +
          noteLines.join("\n\n")
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
