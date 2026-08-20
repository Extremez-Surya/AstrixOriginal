const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} = require("discord.js");
const EMOJIS = require("../../lib/emojis");

module.exports = {
  alias: ["unbanall", "massunban"],
  category: "Moderation",
  desc: "Unban all currently banned members from the server with confirmation.",
  botPermissions: ["BanMembers", "SendMessages"],
  userPermissions: ["Administrator"],
  devOnly: false,

  async execute(client, message, args) {
    if (message.author.id !== message.guild.ownerId && !message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only Server Administrators can execute mass unban.");
    }

    const bans = await message.guild.bans.fetch().catch(() => null);
    if (!bans || bans.size === 0) {
      return message.reply("ℹ️ There are no banned users in this server.");
    }

    const confirmBtn = new ButtonBuilder()
      .setCustomId("unbanall_confirm")
      .setLabel(`Confirm Unban (${bans.size} Users)`)
      .setEmoji("⚠️")
      .setStyle(ButtonStyle.Danger);

    const cancelBtn = new ButtonBuilder()
      .setCustomId("unbanall_cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

    const confirmContainer = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ⚠️ **Mass Unban Confirmation**\n` +
          `-# *Are you sure you want to unban all banned members?*\n\n` +
          `> - **Total Banned Members:** \`${bans.size}\`\n` +
          `> - **Target Guild:** \`${message.guild.name}\`\n\n` +
          `*This action cannot be automatically reversed. Click below to proceed.*`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents(row);

    const replyMsg = await message.reply({
      components: [confirmContainer],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i) => i.user.id === message.author.id,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "unbanall_cancel") {
        const cancelCont = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ❌ **Mass Unban Cancelled**\n-# *Operation aborted.*`)
        );
        return interaction.update({ components: [cancelCont], flags: MessageFlags.IsComponentsV2 });
      }

      await interaction.deferUpdate();
      let unbannedCount = 0;

      for (const [, ban] of bans) {
        try {
          await message.guild.bans.remove(ban.user.id, `Mass unban executed by ${message.author.tag}`);
          unbannedCount++;
        } catch (e) {}
      }

      const resultCont = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${EMOJIS.tick || "✅"} **Mass Unban Completed**\n` +
          `-# *Successfully unbanned \`${unbannedCount}\` of \`${bans.size}\` members.*\n\n` +
          `> - **Executor:** <@${message.author.id}>`
        )
      );

      return replyMsg.edit({ components: [resultCont], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
    });
  },
};
