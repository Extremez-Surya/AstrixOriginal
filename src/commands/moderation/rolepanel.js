const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  alias: ["rolepanel", "rpanel"],
  category: "Moderation",
  desc: "Open the role management panel for a role.",
  botPermissions: ["ManageRoles"],
  userPermissions: ["ManageRoles"],
  devOnly: false,

  async execute(client, message, args) {
    const guild = message.guild;

    let role = message.mentions.roles.first();

    if (!role && args[0]) {
      const cleanFirst = args[0].replace(/[<@!&>]/g, "");
      role = guild.roles.cache.get(cleanFirst);

      if (!role) {
        const fullName = args.join(" ");
        role =
          guild.roles.cache.find(
            (r) => r.name.toLowerCase() === fullName.toLowerCase(),
          ) || guild.roles.cache.get(fullName.replace(/[<@!&>]/g, ""));
      }
    }

    if (!role) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Role Specified Required\n` +
          `-# *Please mention a role or provide a valid role ID / name.*\n\n` +
          `> - **Usage:** \`.rolepanel <@role | role_name | role_id>\``
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    if (role.position >= guild.members.me.roles.highest.position) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Hierarchy Check Failed\n` +
          `-# *I cannot manage this role because it is higher than or equal to my highest role.*`
        )
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], repliedUser: false },
      }).catch(() => null);
    }

    const commandStartTime = Date.now();
    let showRoleInfo = false;

    const buildPanel = (
      statusMessage = null,
      actionStartTime = commandStartTime,
      disabled = false,
    ) => {
      const execTime = ((Date.now() - actionStartTime) / 1000).toFixed(2);

      const content = [
        `### 🎛️ Role Management Panel`,
        "",
        `> Role: ${role.name}`,
        `> Members: ${role.members.size}`,
        `> Color: ${role.hexColor}`,
      ];

      if (showRoleInfo) {
        content.push(
          "",
          `> **Role Details**`,
          `> - **ID:** \`${role.id}\``,
          `> - **Mention:** ${role}`,
          `> - **Hex Color:** \`${role.hexColor.toUpperCase()}\``,
          `> - **Position:** \`${role.position}\` / \`${guild.roles.cache.size}\``,
          `> - **Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:f> (<t:${Math.floor(role.createdTimestamp / 1000)}:R>)`,
          `> - **Hoisted:** \`${role.hoist ? "Yes" : "No"}\``,
          `> - **Mentionable:** \`${role.mentionable ? "Yes" : "No"}\``,
          `> - **Managed:** \`${role.managed ? "Yes" : "No"}\``,
        );
      }

      content.push(
        "",
        statusMessage
          ? `**Status:** ${statusMessage}`
          : "Choose an action below.",
        "",
        `-# Executed in ${execTime}s`,
      );

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("rp_add_user")
          .setLabel("Add to User")
          .setStyle(ButtonStyle.Success)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId("rp_remove_user")
          .setLabel("Remove from User")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId("rp_role_info")
          .setLabel(showRoleInfo ? "Hide Role Info" : "Role Info")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(disabled),
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("rp_add_humans")
          .setLabel("Add to Humans")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId("rp_add_bots")
          .setLabel("Add to Bots")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(disabled),
        new ButtonBuilder()
          .setCustomId("rp_remove_all")
          .setLabel("Remove from All")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(disabled),
      );

      return new ContainerBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content.join("\n")),
        )
        .addActionRowComponents(row1)
        .addActionRowComponents(row2);
    };

    const initialContainer = buildPanel(null, commandStartTime);
    const replyMsg = await message.reply({
      components: [initialContainer],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [], repliedUser: false },
    });

    const collector = replyMsg.createMessageComponentCollector({
      time: 180000,
    });

    collector.on("collect", async (i) => {
      if (!i.member.permissions.has("ManageRoles")) {
        return i.reply({
          content: "You do not have permission to manage roles.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const action = i.customId;
      const actionStartTime = Date.now();
      let status = "";

      try {
        if (action === "rp_add_user" || action === "rp_remove_user") {
          const isAdd = action === "rp_add_user";
          const modalCustomId = `rp_modal_${isAdd ? "add" : "remove"}_${i.id}`;

          const modal = new ModalBuilder()
            .setCustomId(modalCustomId)
            .setTitle(isAdd ? "Add Role to User" : "Remove Role from User");

          const userInput = new TextInputBuilder()
            .setCustomId("user_input")
            .setLabel("User ID or Mention")
            .setPlaceholder("e.g. 123456789012345678 or @user")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(userInput));

          await i.showModal(modal);

          const submitted = await i
            .awaitModalSubmit({ time: 60000 })
            .catch(() => null);
          if (!submitted) return;

          await submitted.deferUpdate().catch(() => null);

          const rawInput = submitted.fields
            .getTextInputValue("user_input")
            .trim();
          const cleanId = rawInput.replace(/[<@!>]/g, "");

          const targetMember = await guild.members
            .fetch(cleanId)
            .catch(() => guild.members.cache.get(cleanId));

          if (!targetMember) {
            status = `Error: Could not find user \`${rawInput}\` in this server.`;
          } else {
            if (isAdd) {
              if (targetMember.roles.cache.has(role.id)) {
                status = `<@${targetMember.id}> already has role <@&${role.id}>.`;
              } else {
                await targetMember.roles.add(
                  role,
                  `Role Panel: Added by ${i.user.tag}`,
                );
                status = `Successfully added <@&${role.id}> to <@${targetMember.id}>.`;
              }
            } else {
              if (!targetMember.roles.cache.has(role.id)) {
                status = `<@${targetMember.id}> does not have role <@&${role.id}>.`;
              } else {
                await targetMember.roles.remove(
                  role,
                  `Role Panel: Removed by ${i.user.tag}`,
                );
                status = `Successfully removed <@&${role.id}> from <@${targetMember.id}>.`;
              }
            }
          }
        } else if (action === "rp_role_info") {
          await i.deferUpdate().catch(() => null);
          showRoleInfo = !showRoleInfo;
          status = showRoleInfo
            ? "Displayed role details."
            : "Hidden role details.";
        } else {
          await i.deferUpdate().catch(() => null);

          // Safely get members without causing Opcode 8 rate limit error
          let guildMembers = guild.members.cache;
          if (guildMembers.size < guild.memberCount) {
            try {
              const fetched = await guild.members.fetch().catch(() => null);
              if (fetched) guildMembers = fetched;
            } catch (e) {
              guildMembers = guild.members.cache;
            }
          }

          if (action === "rp_add_humans") {
            const targetMembers = guildMembers.filter(
              (m) => !m.user.bot && !m.roles.cache.has(role.id),
            );
            let count = 0;
            for (const [_, m] of targetMembers) {
              try {
                if (role.position < guild.members.me.roles.highest.position) {
                  await m.roles.add(
                    role,
                    `Role Panel: Bulk add humans by ${i.user.tag}`,
                  );
                  count++;
                }
              } catch (err) {}
            }
            status = `Successfully added <@&${role.id}> to ${count} humans.`;
          } else if (action === "rp_add_bots") {
            const targetMembers = guildMembers.filter(
              (m) => m.user.bot && !m.roles.cache.has(role.id),
            );
            let count = 0;
            for (const [_, m] of targetMembers) {
              try {
                if (role.position < guild.members.me.roles.highest.position) {
                  await m.roles.add(
                    role,
                    `Role Panel: Bulk add bots by ${i.user.tag}`,
                  );
                  count++;
                }
              } catch (err) {}
            }
            status = `Successfully added <@&${role.id}> to ${count} bots.`;
          } else if (action === "rp_remove_all") {
            const targetMembers = guildMembers.filter((m) =>
              m.roles.cache.has(role.id),
            );
            let count = 0;
            for (const [_, m] of targetMembers) {
              try {
                if (role.position < guild.members.me.roles.highest.position) {
                  await m.roles.remove(
                    role,
                    `Role Panel: Bulk remove from all by ${i.user.tag}`,
                  );
                  count++;
                }
              } catch (err) {}
            }
            status = `Successfully removed <@&${role.id}> from ${count} members.`;
          }
        }
      } catch (err) {
        status = `Error: ${err.message || String(err)}`;
      }

      await replyMsg
        .edit({
          components: [buildPanel(status, actionStartTime)],
          allowedMentions: { parse: [], repliedUser: false },
        })
        .catch(() => null);
    });

    collector.on("end", async () => {
      try {
        const expiredContainer = buildPanel(
          "This panel has expired and is now inactive.",
          commandStartTime,
          true,
        );
        await replyMsg
          .edit({
            components: [expiredContainer],
            allowedMentions: { parse: [], repliedUser: false },
          })
          .catch(() => null);
      } catch (e) {}
    });
  },
};
