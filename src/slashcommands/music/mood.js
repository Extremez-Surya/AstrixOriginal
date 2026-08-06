const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ApplicationCommandOptionType,
  ComponentType,
} = require("discord.js");

const MOOD_PLAYLISTS = {
  chill: { name: "Chill & Relax", query: "Chill Vibes Lo-Fi Chillout Music" },
  party: { name: "Party Hits", query: "Top Party Hits Dance Music" },
  lofi: { name: "Lo-Fi Beats", query: "Lofi Hip Hop Beats To Relax Study To" },
  focus: { name: "Deep Focus", query: "Deep Focus Ambient Study Instrumental" },
  workout: { name: "Workout Energy", query: "Gym Workout Workout Motivation Music" },
  gaming: { name: "Gaming Beats", query: "Gaming Beats EDM Electronic Phonk" },
  sad: { name: "Sad & Acoustic", query: "Sad Songs Acoustic Emotional Hits" },
  romantic: { name: "Love & Romance", query: "Romantic Songs Love Pop Ballads" },
};

module.exports = {
  name: "mood",
  description: "Play music tailored to a specific mood or vibe.",
  options: [
    {
      name: "vibe",
      description: "Select mood or vibe",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: Object.keys(MOOD_PLAYLISTS).map((k) => ({
        name: MOOD_PLAYLISTS[k].name,
        value: k,
      })),
    },
  ],

  async execute(client, interaction) {
    try {
      const voiceChannel =
        interaction.member?.voice?.channel ||
        (interaction.member?.voice?.channelId
          ? interaction.guild?.channels?.cache?.get(interaction.member.voice.channelId)
          : null);

      if (!voiceChannel) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <a:red_star:1528688099436003419> Voice Channel Required\n` +
              `-# *You must be connected to a voice channel to launch mood playlists.*`
          )
        );
        return interaction.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }

      const selectedVibe = interaction.options.getString("vibe");

      if (selectedVibe && MOOD_PLAYLISTS[selectedVibe]) {
        await interaction.deferReply().catch(() => null);
        return playMoodQuerySlash(client, interaction, voiceChannel, MOOD_PLAYLISTS[selectedVibe]);
      }

      const options = Object.keys(MOOD_PLAYLISTS).map((key) => ({
        label: MOOD_PLAYLISTS[key].name,
        value: key,
        description: `Play ${MOOD_PLAYLISTS[key].name} tracks`,
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("mood_slash_select_menu")
        .setPlaceholder("Select a Mood / Vibe...")
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎭 Select a Music Mood\n` +
            `-# *Choose a vibe from the dropdown menu below to start listening.*`
        )
      );

      const replyMsg = await interaction.reply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2,
      });

      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000,
      });

      collector.on("collect", async (menuInteraction) => {
        if (menuInteraction.user.id !== interaction.user.id) {
          return menuInteraction.reply({
            content: "⚠️ Only the user who ran the command can select a mood.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const selectedKey = menuInteraction.values[0];
        const moodData = MOOD_PLAYLISTS[selectedKey];

        await menuInteraction.deferUpdate();
        await playMoodQuerySlash(client, interaction, voiceChannel, moodData, true);
        collector.stop("selected");
      });
    } catch (err) {
      console.error("[MoodSlash] Error:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **An error occurred while launching mood music.**")
      );
      return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }
  },
};

async function playMoodQuerySlash(client, interaction, voiceChannel, moodData, isEdit = false) {
  let player = client.manager.players.get(interaction.guild.id);
  if (!player) {
    player = await client.manager.createPlayer({
      guildId: interaction.guild.id,
      voiceId: voiceChannel.id,
      textId: interaction.channel.id,
      deaf: true,
    });
  }

  const res = await client.manager.search(moodData.query, {
    requester: interaction.user,
    engine: "youtube",
  }).catch(() => null);

  if (!res || !res.tracks || !res.tracks.length) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`❌ **Could not find tracks for mood: \`${moodData.name}\`**`)
    );
    if (isEdit) {
      return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }
    return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }

  const tracksToAdd = res.tracks.slice(0, 5);
  for (const track of tracksToAdd) {
    player.queue.add(track);
  }

  if (!player.playing && !player.paused) {
    await player.play();
  }

  const container = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `🎭 **Playing Mood:** \`${moodData.name}\`\n` +
        `-# *Added ${tracksToAdd.length} track(s) to the queue.*`
    )
  );

  return interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}
