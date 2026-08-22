const {
  ApplicationCommandType,
  ApplicationCommandOptionType,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  SectionBuilder,
  ThumbnailBuilder,
} = require("discord.js");

module.exports = {
  name: "roblox",
  category: "Information",
  description:
    "Fetch public Roblox user profile statistics and account details.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "username",
      description: "Roblox username to inspect.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, interaction) {
    await interaction.deferReply();
    const username = interaction.options.getString("username");
    let user = null;

    try {
      const searchRes = await fetch(
        "https://users.roblox.com/v1/usernames/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usernames: [username],
            excludeBannedUsers: false,
          }),
        },
      );
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data[0]) {
        const userId = searchData.data[0].id;
        const detailsRes = await fetch(
          `https://users.roblox.com/v1/users/${userId}`,
        );
        user = await detailsRes.json();
      }
    } catch (e) {}

    if (!user) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Roblox Profile Not Found\n` +
            `-# *No Roblox account found matching \`${username}\`.*`,
        ),
      );
      return interaction
        .editReply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        })
        .catch(() => null);
    }

    let friendsCount = 0;
    let followersCount = 0;
    let followingsCount = 0;
    let avatarImageUrl = null;

    try {
      const [friendsRes, followersRes, followingsRes, avatarRes] =
        await Promise.all([
          fetch(`https://friends.roblox.com/v1/users/${user.id}/friends/count`),
          fetch(
            `https://friends.roblox.com/v1/users/${user.id}/followers/count`,
          ),
          fetch(
            `https://friends.roblox.com/v1/users/${user.id}/followings/count`,
          ),
          fetch(
            `https://thumbnails.roblox.com/v1/users/avatar?userIds=${user.id}&size=720x720&format=Png`,
          ),
        ]);

      if (friendsRes.status === 200) {
        friendsCount = (await friendsRes.json()).count || 0;
      }
      if (followersRes.status === 200) {
        followersCount = (await followersRes.json()).count || 0;
      }
      if (followingsRes.status === 200) {
        followingsCount = (await followingsRes.json()).count || 0;
      }
      if (avatarRes.status === 200) {
        const avData = await avatarRes.json();
        if (avData.data && avData.data[0]) {
          avatarImageUrl = avData.data[0].imageUrl;
        }
      }
    } catch (e) {}

    const createdTs = Math.floor(new Date(user.created).getTime() / 1000);
    const bioText = user.description
      ? user.description.trim().replace(/\r?\n|\r/g, " ")
      : "No profile description provided.";

    const content = [
      `### <:roblox_op:1539875542571163648> Roblox Profile ── ${user.displayName} (@${user.name})`,
      `-# *${bioText}*`,
      "",
      `> <:members:1539875392532512808> **Identity & Status**`,
      `> - **Display Name:** \`${user.displayName}\``,
      `> - **Username:** \`@${user.name}\` ${user.hasVerifiedBadge ? "• <:ticky_red:1539875600280592495> *Verified*" : ""}`,
      `> - **Roblox User ID:** \`${user.id}\``,
      `> - **Account Status:** \`${user.isBanned ? "Banned <:red_circle:1539875594744107008>" : "Clean <:online:1539875424144859239>"}\``,
      `> - **Account Created:** <t:${createdTs}:D> (<t:${createdTs}:R>)`,
      "",
      `> <:members:1539875392532512808> **Social & Telemetry**`,
      `> - **Friends:** \`${friendsCount.toLocaleString()}\``,
      `> - **Followers:** \`${followersCount.toLocaleString()}\``,
      `> - **Following:** \`${followingsCount.toLocaleString()}\``,
    ].join("\n");

    const files = [];
    const container = new ContainerBuilder();

    if (avatarImageUrl) {
      try {
        const avatarAttachment = new AttachmentBuilder(avatarImageUrl, {
          name: "roblox_avatar.png",
        });
        files.push(avatarAttachment);

        const section = new SectionBuilder()
          .setThumbnailAccessory(
            new ThumbnailBuilder().setURL("attachment://roblox_avatar.png"),
          )
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(content),
          );

        container.addSectionComponents(section);
      } catch (e) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(content),
        );
      }
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(content),
      );
    }

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Roblox Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/users/${user.id}/profile`),
      new ButtonBuilder()
        .setLabel("Rolimons Stats")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.rolimons.com/player/${user.id}`),
      new ButtonBuilder()
        .setLabel("Inventory")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://www.roblox.com/users/${user.id}/inventory`),
    );

    container
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setSpacing(SeparatorSpacingSize.Small)
          .setDivider(true),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `-# *Powered by ASTRIXCODE™ • © 2026 ASTRIXCODE*`,
        ),
      )
      .addActionRowComponents(actionRow);

    return interaction
      .editReply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
