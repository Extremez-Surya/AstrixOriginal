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

const LANGUAGE_MAP = {
  af: { name: "Afrikaans", flag: "🇿🇦" },
  sq: { name: "Albanian", flag: "🇦🇱" },
  am: { name: "Amharic", flag: "🇪🇹" },
  ar: { name: "Arabic", flag: "🇸🇦" },
  hy: { name: "Armenian", flag: "🇦🇲" },
  az: { name: "Azerbaijani", flag: "🇦🇿" },
  bn: { name: "Bengali", flag: "🇧🇩" },
  bs: { name: "Bosnian", flag: "🇧🇦" },
  bg: { name: "Bulgarian", flag: "🇧🇬" },
  ca: { name: "Catalan", flag: "🇪🇸" },
  zh: { name: "Chinese", flag: "🇨🇳" },
  "zh-cn": { name: "Chinese", flag: "🇨🇳" },
  "zh-tw": { name: "Chinese", flag: "🇹🇼" },
  hr: { name: "Croatian", flag: "🇭🇷" },
  cs: { name: "Czech", flag: "🇨🇿" },
  da: { name: "Danish", flag: "🇩🇰" },
  nl: { name: "Dutch", flag: "🇳🇱" },
  en: { name: "English", flag: "🇺🇸" },
  et: { name: "Estonian", flag: "🇪🇪" },
  fi: { name: "Finnish", flag: "🇫🇮" },
  fr: { name: "French", flag: "🇫🇷" },
  ka: { name: "Georgian", flag: "🇬🇪" },
  de: { name: "German", flag: "🇩🇪" },
  el: { name: "Greek", flag: "🇬🇷" },
  gu: { name: "Gujarati", flag: "🇮🇳" },
  he: { name: "Hebrew", flag: "🇮🇱" },
  hi: { name: "Hindi", flag: "🇮🇳" },
  hu: { name: "Hungarian", flag: "🇭🇺" },
  is: { name: "Icelandic", flag: "🇮🇸" },
  id: { name: "Indonesian", flag: "🇮🇩" },
  it: { name: "Italian", flag: "🇮🇹" },
  ja: { name: "Japanese", flag: "🇯🇵" },
  kn: { name: "Kannada", flag: "🇮🇳" },
  kk: { name: "Kazakh", flag: "🇰🇿" },
  ko: { name: "Korean", flag: "🇰🇷" },
  lv: { name: "Latvian", flag: "🇱🇻" },
  lt: { name: "Lithuanian", flag: "🇱🇹" },
  mk: { name: "Macedonian", flag: "🇲🇰" },
  ms: { name: "Malay", flag: "🇲🇾" },
  ml: { name: "Malayalam", flag: "🇮🇳" },
  mr: { name: "Marathi", flag: "🇮🇳" },
  ne: { name: "Nepali", flag: "🇳🇵" },
  no: { name: "Norwegian", flag: "🇳🇴" },
  fa: { name: "Persian", flag: "🇮🇷" },
  pl: { name: "Polish", flag: "🇵🇱" },
  pt: { name: "Portuguese", flag: "🇵🇹" },
  pa: { name: "Punjabi", flag: "🇮🇳" },
  ro: { name: "Romanian", flag: "🇷🇴" },
  ru: { name: "Russian", flag: "🇷🇺" },
  sr: { name: "Serbian", flag: "🇷🇸" },
  si: { name: "Sinhala", flag: "🇱🇰" },
  sk: { name: "Slovak", flag: "🇸🇰" },
  sl: { name: "Slovenian", flag: "🇸🇮" },
  es: { name: "Spanish", flag: "🇪🇸" },
  sw: { name: "Swahili", flag: "🇰🇪" },
  sv: { name: "Swedish", flag: "🇸🇪" },
  ta: { name: "Tamil", flag: "🇮🇳" },
  te: { name: "Telugu", flag: "🇮🇳" },
  th: { name: "Thai", flag: "🇹🇭" },
  tr: { name: "Turkish", flag: "🇹🇷" },
  uk: { name: "Ukrainian", flag: "🇺🇦" },
  ur: { name: "Urdu", flag: "🇵🇰" },
  vi: { name: "Vietnamese", flag: "🇻🇳" },
};

function getLangInfo(code) {
  if (!code) return { name: "Auto", flag: "<:website:1528304906400960582>" };
  const lower = code.toLowerCase();
  const info = LANGUAGE_MAP[lower];
  if (info) return { name: info.name, flag: info.flag };
  return { name: code.toUpperCase(), flag: "<:website:1528304906400960582>" };
}

module.exports = {
  alias: ["translate", "tr"],
  category: "Information",
  desc: "Translate text into any language (default: English).",

  botPermissions: ["SendMessages"],
  userPermissions: ["SendMessages"],
  devOnly: false,

  async execute(client, message, args) {
    if (!args.length) {
      const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### <a:red_star:1528688099436003419> Missing Text\n` +
            `-# *Usage: \`.translate [target_lang] <text>\` (e.g. \`.translate es Hello world\`).*`,
        ),
      );
      return message
        .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
        .catch(() => null);
    }

    let targetLang = "en";
    let textToTranslate = args.join(" ");

    // Check if first arg is a 2-letter language code
    if (args[0].length === 2 && args.length > 1) {
      targetLang = args[0].toLowerCase();
      textToTranslate = args.slice(1).join(" ");
    }

    let translated = "";
    let detectedLang = "auto";

    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`,
      );
      const data = await res.json();
      if (data) {
        if (data[0]) {
          translated = data[0].map((item) => item[0]).join("");
        }
        if (data[2]) {
          detectedLang = data[2];
        }
      }
    } catch (e) {}

    if (!translated) {
      translated = textToTranslate;
    }

    const srcInfo = getLangInfo(detectedLang);
    const targetInfo = getLangInfo(targetLang);

    const webUrl = `https://translate.google.com/?sl=${encodeURIComponent(detectedLang)}&tl=${encodeURIComponent(targetLang)}&text=${encodeURIComponent(textToTranslate)}&op=translate`;

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Open Google Translate")
        .setStyle(ButtonStyle.Link)
        .setURL(webUrl),
    );

    const content = [
      `### <:website:1528304906400960582> ${srcInfo.flag} ${srcInfo.name} → ${targetInfo.flag} ${targetInfo.name}`,
      "",
      `> **Original:** ${textToTranslate}`,
      `> **Translation:** ${translated}`,
    ].join("\n");

    const container = new ContainerBuilder()
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(content))
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
      .reply({ components: [container], flags: MessageFlags.IsComponentsV2 })
      .catch(() => null);
  },
};
