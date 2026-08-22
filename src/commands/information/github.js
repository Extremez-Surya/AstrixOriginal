const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
} = require("discord.js");

module.exports = {
  alias: ["github", "gh"],
  category: "Information",
  desc: "Fetch public profile statistics for any GitHub developer.",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args[0]) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Missing Username\n` +
            `-# *Please specify a GitHub username (e.g. \`.github octocat\`).*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const username = args[0];
    let user = null;

    try {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}`,
        {
          headers: {
            "User-Agent": "AstrixBot/1.0",
          },
        },
      );
      if (res.status === 200) {
        user = await res.json();
      }
    } catch (e) {}

    if (!user) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <:red_star:1539875482680696834> Developer Not Found\n` +
            `-# *No GitHub account found matching \`${username}\`.*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    const createdTs = Math.floor(new Date(user.created_at).getTime() / 1000);
    const bioText = user.bio
      ? user.bio.trim().replace(/\r?\n|\r/g, " ")
      : "No public bio provided.";

    const content = [
      `### <:github:1539875546651955220> GitHub Profile ── ${user.name || user.login}`,
      `-# *${bioText}*`,
      "",
      `> <:members:1539875392532512808> **Identity & Details**`,
      `> - **Username:** \`@${user.login}\` ${user.hireable ? "• <:website:1539875380159184977> *Open for Hire*" : ""}`,
      `> - **Account Type:** \`${user.type}\``,
      `> - **Company:** \`${user.company ? user.company.trim() : "None"}\``,
      `> - **Location:** \`${user.location ? user.location.trim() : "Not specified"}\``,
      `> - **Joined GitHub:** <t:${createdTs}:D> (<t:${createdTs}:R>)`,
      "",
      `> <:stats:1539875420256866314> **Activity & Telemetry**`,
      `> - **Public Repositories:** \`${user.public_repos.toLocaleString()}\``,
      `> - **Public Gists:** \`${user.public_gists.toLocaleString()}\``,
      `> - **Followers:** \`${user.followers.toLocaleString()}\` | **Following:** \`${user.following.toLocaleString()}\``,
      user.twitter_username
        ? `> - **Twitter/X:** [@${user.twitter_username}](https://twitter.com/${user.twitter_username})`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const files = [];
    let mediaGallery;

    if (user.avatar_url) {
      try {
        const avatarAttachment = new AttachmentBuilder(user.avatar_url, {
          name: "github_avatar.png",
        });
        files.push(avatarAttachment);
        mediaGallery = new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(
            "attachment://github_avatar.png",
          ),
        );
      } catch (e) {}
    }

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("View Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(user.html_url),
      new ButtonBuilder()
        .setLabel(`Repositories (${user.public_repos})`)
        .setStyle(ButtonStyle.Link)
        .setURL(`${user.html_url}?tab=repositories`),
    );

    if (user.blog) {
      let blogUrl = user.blog.trim();
      if (!blogUrl.startsWith("http://") && !blogUrl.startsWith("https://")) {
        blogUrl = `https://${blogUrl}`;
      }
      try {
        new URL(blogUrl);
        actionRow.addComponents(
          new ButtonBuilder()
            .setLabel("Website")
            .setStyle(ButtonStyle.Link)
            .setURL(blogUrl),
        );
      } catch (e) {}
    }

    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(content),
    );

    if (mediaGallery) {
      container.addMediaGalleryComponents(mediaGallery);
    }

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

    return message
      .reply({
        components: [container],
        files: files,
        flags: MessageFlags.IsComponentsV2,
      })
      .catch(() => null);
  },
};
