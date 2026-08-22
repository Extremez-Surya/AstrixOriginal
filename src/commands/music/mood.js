const {
  ContainerBuilder,
  TextDisplayBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
  ComponentType,
} = require("discord.js");
const { getSearchEngine } = require("../../lib/musicManager.js");

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

/** @type {import('../../lib/types/index.ts').MessageCommand} */
module.exports = {
  alias: ["mood", "vibes", "presetmusic"],
  category: "Music",
  desc: "Play music tailored to a specific mood or vibe.",

  botPermissions: ["SendMessages", "Connect", "Speak"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    try {
      const voiceChannel =
        message.member?.voice?.channel ||
        (message.member?.voice?.channelId
          ? message.guild?.channels?.cache?.get(message.member.voice.channelId)
          : null);

      if (!voiceChannel) {
        const container = new ContainerBuilder().addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### <:red_star:1539875482680696834> Voice Channel Required\n` +
              `-# *You must be connected to a voice channel to launch mood playlists.*`,
          ),
        );
        return message.reply({
          components: [container],
          flags: MessageFlags.IsComponentsV2,
        });
      }

      const inputMood = args[0]?.toLowerCase();

      if (inputMood && MOOD_PLAYLISTS[inputMood]) {
        return playMoodQuery(client, message, voiceChannel, MOOD_PLAYLISTS[inputMood]);
      }

      const options = Object.keys(MOOD_PLAYLISTS).map((key) => ({
        label: MOOD_PLAYLISTS[key].name,
        value: key,
        description: `Play ${MOOD_PLAYLISTS[key].name} tracks`,
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("mood_select_menu")
        .setPlaceholder("Select a Mood / Vibe...")
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### 🎭 Select a Music Mood\n` +
            `-# *Choose a vibe from the dropdown menu below or type \`${client.prefix || "."}mood <chill|party|lofi|focus|workout|gaming>\`*`,
        ),
      );

      const replyMsg = await message.reply({
        components: [container, row],
        flags: MessageFlags.IsComponentsV2,
      });

      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "⚠️ Only the user who ran the command can select a mood.",
            flags: MessageFlags.Ephemeral,
          });
        }

        const selectedKey = interaction.values[0];
        const moodData = MOOD_PLAYLISTS[selectedKey];

        await interaction.deferUpdate();
        await playMoodQuery(client, message, voiceChannel, moodData, replyMsg);
        collector.stop("selected");
      });
    } catch (err) {
      console.error("[MoodCommand] Error:", err);
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent("❌ **An error occurred while launching mood music.**"),
      );
      return message.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }
  },
};

async function playMoodQuery(client, message, voiceChannel, moodData, existingMessage = null) {
  let player = client.manager.players.get(message.guild.id);
  if (!player) {
    player = await client.manager.createPlayer({
      guildId: message.guild.id,
      voiceId: voiceChannel.id,
      textId: message.channel.id,
      deaf: true,
    });
  }

  const res = await client.manager.search(moodData.query, {
    requester: message.author,
    engine: "youtube",
  }).catch(() => null);

  if (!res || !res.tracks || !res.tracks.length) {
    const container = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`❌ **Could not find tracks for mood: \`${moodData.name}\`**`),
    );
    if (existingMessage) {
      return existingMessage.edit({ components: [container] });
    }
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
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
        `-# *Added ${tracksToAdd.length} track(s) to the queue.*`,
    ),
  );

  if (existingMessage) {
    return existingMessage.edit({ components: [container], flags: MessageFlags.IsComponentsV2 });
  }
  return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}
