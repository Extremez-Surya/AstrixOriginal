const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

async function confirmAction({
  client,
  context,
  moderator,
  targetUser,
  actionName,
  detailsText,
  onConfirm,
}) {
  const isInteraction = !!context.editReply;

  // Build the confirmation page
  const buildConfirmPage = (status, errorMsg = "") => {
    let title = "";
    let desc = "";
    let emoji = "";

    if (status === "pending") {
      title = `Confirm Proposed ${actionName}`;
      desc = `Review details before executing the action.`;
      emoji = "<:Warn_red:1528691439658078290>";
    } else if (status === "confirmed") {
      title = `${actionName} Executed Successfully`;
      desc = `The action has been processed and logged.`;
      emoji = "<:online:1528327584520081519>";
    } else if (status === "cancelled") {
      title = `Action Aborted`;
      desc = `The proposed action was cancelled by the moderator.`;
      emoji = "<:offline:1528328082434424892>";
    } else if (status === "failed") {
      title = `${actionName} Failed`;
      desc = `An error occurred during execution:\n> \`${errorMsg}\``;
      emoji = "<:offline:1528328082434424892>";
    } else if (status === "timeout") {
      title = `Action Expired`;
      desc = `The confirmation request timed out.`;
      emoji = "<:offline:1528328082434424892>";
    }

    const content = [
      `### ${emoji} ${title}`,
      `-# *${desc}*`,
      "",
      `> **Target Member:** <@${targetUser.id}> ─ \`${targetUser.username}\` (ID: \`${targetUser.id}\`)`,
      `> **Moderator:** <@${moderator.id}>`,
      detailsText ? `> **Details:** ${detailsText}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("mod_confirm")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(status !== "pending"),
      new ButtonBuilder()
        .setCustomId("mod_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(status !== "pending")
    );

    return new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true)
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *<:astrix:1527205612205903973> Moderation Subsystem • Powered by ASTRIXCODE™ • © 2026*`
        )
      )
      .addActionRowComponents(row);
  };

  const container = buildConfirmPage("pending");

  let replyMsg;
  if (isInteraction) {
    await context.editReply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
    replyMsg = await context.fetchReply();
  } else {
    replyMsg = await context.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });
  }

  // Create component collector
  const filter = (i) => i.user.id === moderator.id;
  const collector = replyMsg.createMessageComponentCollector({
    filter,
    time: 30000,
  });

  collector.on("collect", async (i) => {
    await i.deferUpdate();

    if (i.customId === "mod_confirm") {
      collector.stop("confirmed");
    } else if (i.customId === "mod_cancel") {
      collector.stop("cancelled");
    }
  });

  collector.on("end", async (collected, reason) => {
    let finalStatus = "timeout";
    let errorMsg = "";

    if (reason === "confirmed") {
      try {
        await onConfirm();
        finalStatus = "confirmed";
      } catch (err) {
        console.error(err);
        finalStatus = "failed";
        errorMsg = err.message || String(err);
      }
    } else if (reason === "cancelled") {
      finalStatus = "cancelled";
    }

    const finalContainer = buildConfirmPage(finalStatus, errorMsg);

    try {
      if (isInteraction) {
        await context.editReply({
          components: [finalContainer],
          flags: MessageFlags.IsComponentsV2,
        });
      } else {
        await replyMsg.edit({
          components: [finalContainer],
          allowedMentions: { parse: [], repliedUser: false },
        });
      }
    } catch (e) {}
  });
}

module.exports = { confirmAction };
