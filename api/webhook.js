const DISCORD_EMBED_LIMIT = 4096;
const DISCORD_FIELD_LIMIT = 1024;
const DISCORD_CONTENT_LIMIT = 2000;
const INSTAGRAM_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png";

const IDENTIFIER_ADJECTIVES = [
  "amber",
  "brisk",
  "bright",
  "calm",
  "clear",
  "cosmic",
  "crimson",
  "electric",
  "golden",
  "honest",
  "lively",
  "lunar",
  "mellow",
  "neon",
  "nimble",
  "polished",
  "quick",
  "radiant",
  "silver",
  "steady",
  "velvet",
  "vivid",
  "warm",
  "zesty",
];

const IDENTIFIER_NOUNS = [
  "amp",
  "bridge",
  "cadence",
  "chorus",
  "cymbal",
  "echo",
  "fader",
  "groove",
  "harmony",
  "lyric",
  "meter",
  "octave",
  "pulse",
  "reverb",
  "riff",
  "signal",
  "snare",
  "spark",
  "tempo",
  "track",
  "verse",
  "wave",
  "wire",
  "zine",
];

const FIELD_TITLES = {
  comments: "Instagram Comment",
  live_comments: "Instagram Live Comment",
  mentions: "Instagram Mention",
  message_edit: "Instagram Message Edited",
  message_reactions: "Instagram Message Reaction",
  messages: "Instagram DM",
  messaging_handover: "Instagram Messaging Handover",
  messaging_postbacks: "Instagram Postback",
  messaging_referral: "Instagram Referral",
  messaging_seen: "Instagram Seen",
  standby: "Instagram Standby",
  story_insights: "Instagram Story Insights",
};

const FIELD_COLORS = {
  comments: 0x833ab4,
  live_comments: 0xc13584,
  mentions: 0xf56040,
  message_edit: 0x5851db,
  message_reactions: 0xffdc80,
  messages: 0xe1306c,
  messaging_handover: 0x405de6,
  messaging_postbacks: 0x0099ff,
  messaging_referral: 0x00b894,
  messaging_seen: 0x2d3436,
  standby: 0x636e72,
  story_insights: 0xfd1d1d,
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Forbidden");
  }

  if (req.method === "POST") {
    const body = req.body;

    if (body?.object !== "instagram") {
      return res.status(200).send("EVENT_RECEIVED");
    }

    try {
      await processInstagramWebhook(body);
    } catch (error) {
      console.error("Failed to process Instagram webhook:", error);
    }

    return res.status(200).send("EVENT_RECEIVED");
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).send("Method Not Allowed");
}

async function processInstagramWebhook(body) {
  const entries = Array.isArray(body.entry) ? body.entry : [];

  for (const entry of entries) {
    try {
      await sendRawToDiscord(entry);
    } catch (error) {
      console.error("Failed to send raw Instagram webhook:", error);
    }

    const embeds = await buildEmbedsForEntry(entry);

    for (const embed of embeds) {
      try {
        await sendParsedToDiscord(embed);
      } catch (error) {
        console.error("Failed to send parsed Instagram webhook:", error);
      }
    }
  }
}

async function buildEmbedsForEntry(entry) {
  return [
    ...(await buildMessagingEmbeds(entry)),
    ...buildChangeEmbeds(entry),
    ...buildStandbyEmbeds(entry),
  ];
}

async function buildMessagingEmbeds(entry) {
  const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];
  const embeds = [];

  for (const event of messagingEvents) {
    const eventType = getMessagingEventType(event);
    const identifier = createEventIdentifier(entry, event, eventType);
    const senderProfile = await fetchInstagramProfile(event.sender?.id);
    const message = event.message;
    const title = FIELD_TITLES[eventType] ?? "Instagram Messaging Event";
    const fields = [
      formatField("Identifier", identifier, true),
      formatField("Type", eventType, true),
      formatField("Time", formatMetaTimestamp(event.timestamp), true),
      formatField(
        "Sender",
        formatProfile(senderProfile, event.sender?.id),
        true,
      ),
      formatField("Recipient ID", event.recipient?.id, true),
    ].filter(Boolean);

    embeds.push({
      title,
      description: getMessagingDescription(event, eventType),
      color: FIELD_COLORS[eventType] ?? 0xe1306c,
      thumbnail: senderProfile?.profile_pic
        ? { url: senderProfile.profile_pic }
        : undefined,
      fields: [
        ...fields,
        ...buildMessageDetailFields(message, eventType),
      ].filter(Boolean),
      footer: {
        text: `Instagram webhook | ${identifier}`,
      },
    });
  }

  return embeds;
}

function buildChangeEmbeds(entry) {
  const changes = Array.isArray(entry.changes) ? entry.changes : [];

  return changes.map((change) => {
    const value = change.value ?? {};
    const fieldName = change.field ?? "unknown";
    const identifier = createEventIdentifier(entry, change, fieldName);

    return {
      title: FIELD_TITLES[fieldName] ?? `Instagram ${fieldName}`,
      description: getChangeDescription(fieldName, value),
      color: FIELD_COLORS[fieldName] ?? 0x833ab4,
      fields: [
        formatField("Identifier", identifier, true),
        formatField("Field", fieldName, true),
        formatField("Entry ID", entry.id, true),
        ...buildChangeDetailFields(fieldName, value),
      ].filter(Boolean),
      footer: {
        text: `Instagram webhook | ${identifier}`,
      },
    };
  });
}

function buildStandbyEmbeds(entry) {
  const standbyEvents = Array.isArray(entry.standby) ? entry.standby : [];

  return standbyEvents.map((event) => {
    const identifier = createEventIdentifier(entry, event, "standby");

    return {
      title: FIELD_TITLES.standby,
      description: "Standby channel event received.",
      color: FIELD_COLORS.standby,
      fields: [
        formatField("Identifier", identifier, true),
        formatField("Sender ID", event.sender?.id, true),
        formatField("Recipient ID", event.recipient?.id, true),
        formatField("Time", formatMetaTimestamp(event.timestamp), true),
      ].filter(Boolean),
      footer: {
        text: `Instagram webhook | ${identifier}`,
      },
    };
  });
}

function getMessagingEventType(event) {
  if (event.message?.is_deleted) return "message_edit";
  if (event.message) return "messages";
  if (event.reaction) return "message_reactions";
  if (event.read) return "messaging_seen";
  if (event.postback) return "messaging_postbacks";
  if (event.referral) return "messaging_referral";
  if (
    event.pass_thread_control ||
    event.take_thread_control ||
    event.request_thread_control
  ) {
    return "messaging_handover";
  }

  return "messages";
}

function getMessagingDescription(event, eventType) {
  if (eventType === "messages") {
    return truncate(
      event.message?.text || describeAttachments(event.message),
      DISCORD_EMBED_LIMIT,
    );
  }

  if (eventType === "message_reactions") {
    return truncate(
      `${event.reaction?.action ?? "reaction"} ${event.reaction?.emoji ?? event.reaction?.reaction ?? ""}`.trim(),
      DISCORD_EMBED_LIMIT,
    );
  }

  if (eventType === "messaging_seen") {
    return "User has seen the message.";
  }

  if (eventType === "messaging_postbacks") {
    return truncate(
      event.postback?.title || event.postback?.payload || "Postback received.",
      DISCORD_EMBED_LIMIT,
    );
  }

  if (eventType === "messaging_referral") {
    return truncate(
      event.referral?.ref || "Referral received.",
      DISCORD_EMBED_LIMIT,
    );
  }

  if (eventType === "messaging_handover") {
    return "Messaging handover event received.";
  }

  return "Messaging event received.";
}

function getChangeDescription(fieldName, value) {
  if (fieldName === "comments" || fieldName === "live_comments") {
    return truncate(
      value.text || "Comment event received.",
      DISCORD_EMBED_LIMIT,
    );
  }

  if (fieldName === "mentions") {
    return truncate(
      `Mention received. Media ID: ${value.media_id ?? "-"} | Comment ID: ${value.comment_id ?? "-"}`,
      DISCORD_EMBED_LIMIT,
    );
  }

  if (fieldName === "story_insights") {
    return truncate(
      `Story expired. Media ID: ${value.media_id ?? "-"}`,
      DISCORD_EMBED_LIMIT,
    );
  }

  return truncate(`${fieldName} event received.`, DISCORD_EMBED_LIMIT);
}

function buildMessageDetailFields(message, eventType) {
  if (!message) {
    return [
      formatField(
        "Note",
        `${eventType} event has no message text payload.`,
        false,
      ),
    ].filter(Boolean);
  }

  return [
    formatField("Message ID", message.mid, false),
    formatField("Reply To", message.reply_to?.mid, true),
    formatField("Folder", message.folder, true),
    formatField("Story ID", message.story?.id, true),
    formatField("Attachments", describeAttachments(message), false),
  ].filter(Boolean);
}

function buildChangeDetailFields(fieldName, value) {
  if (fieldName === "comments" || fieldName === "live_comments") {
    return [
      formatField("From", formatUser(value.from), true),
      formatField("Media ID", value.media?.id, true),
      formatField("Product Type", value.media?.media_product_type, true),
      formatField("Parent Comment ID", value.parent_id, true),
      formatField(
        "Ad",
        [value.ad_title, value.ad_id].filter(Boolean).join(" | "),
        true,
      ),
    ].filter(Boolean);
  }

  if (fieldName === "mentions") {
    return [
      formatField("Media ID", value.media_id, true),
      formatField("Comment ID", value.comment_id, true),
    ].filter(Boolean);
  }

  if (fieldName === "story_insights") {
    return [
      formatField("Media ID", value.media_id, true),
      formatField("Impressions", value.impressions, true),
      formatField("Reach", value.reach, true),
      formatField("Taps Forward", value.taps_forward, true),
      formatField("Taps Back", value.taps_back, true),
      formatField("Exits", value.exits, true),
      formatField("Replies", value.replies, true),
    ].filter(Boolean);
  }

  return [];
}

function formatField(name, value, inline = false) {
  if (value === undefined || value === null || value === "") return null;

  return {
    name,
    value: truncate(String(value), DISCORD_FIELD_LIMIT),
    inline,
  };
}

function formatUser(user) {
  if (!user) return null;
  return [user.username, user.id].filter(Boolean).join(" | ");
}

function formatProfile(profile, fallbackId) {
  if (!profile) return fallbackId;
  const username = profile.username ? `@${profile.username}` : null;
  return [username, profile.name, profile.id].filter(Boolean).join(" | ");
}

function describeAttachments(message) {
  const attachments = Array.isArray(message?.attachments)
    ? message.attachments
    : [];
  if (!attachments.length) return null;

  return attachments
    .map((attachment) => {
      const postId = attachment.payload?.ig_post_media_id;
      return [attachment.type, postId && `post:${postId}`]
        .filter(Boolean)
        .join(" ");
    })
    .join("\n");
}

function stringifyRawPayload(value) {
  return JSON.stringify(value, null, 2);
}

function formatMetaTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? String(timestamp) : date.toISOString();
}

function truncate(value, maxLength) {
  if (!value) return value;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function createEventIdentifier(entry, event, eventType) {
  const basis = [
    entry?.id,
    eventType,
    event?.message?.mid,
    event?.read?.mid,
    event?.reaction?.mid,
    event?.sender?.id,
    event?.recipient?.id,
    event?.timestamp,
    event?.field,
    event?.value?.media_id,
    event?.value?.comment_id,
  ]
    .filter(Boolean)
    .join(":");
  const hash = hashString(basis || JSON.stringify(event));
  const adjective = IDENTIFIER_ADJECTIVES[hash % IDENTIFIER_ADJECTIVES.length];
  const noun =
    IDENTIFIER_NOUNS[
      Math.floor(hash / IDENTIFIER_ADJECTIVES.length) % IDENTIFIER_NOUNS.length
    ];
  const suffix = String(hash % 10000).padStart(4, "0");

  return `${adjective}-${noun}-${suffix}`;
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

async function fetchInstagramProfile(id) {
  if (!id || !process.env.INSTAGRAM_ACCESS_TOKEN) return null;

  const url = new URL(`https://graph.instagram.com/v25.0/${id}`);
  url.searchParams.set("fields", "id,username,name,profile_pic");
  url.searchParams.set("access_token", process.env.INSTAGRAM_ACCESS_TOKEN);

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Instagram profile:", error);
    return null;
  }
}

async function sendRawToDiscord(entry) {
  const webhookUrl =
    process.env.DISCORD_RAW_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_RAW_URL;

  if (!webhookUrl) {
    console.warn("DISCORD_RAW_WEBHOOK_URL is not configured.");
    return;
  }

  const rawPayload = stringifyRawPayload(entry);

  for (const chunk of chunkForDiscord(rawPayload, DISCORD_CONTENT_LIMIT)) {
    await sendDiscordPayload(webhookUrl, {
      content: chunk,
    });
  }
}

async function sendParsedToDiscord(embed) {
  const webhookUrl =
    process.env.DISCORD_PARSED_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("DISCORD_PARSED_WEBHOOK_URL is not configured.");
    return;
  }

  await sendDiscordPayload(webhookUrl, {
    username: "Instagram Notif",
    avatar_url: INSTAGRAM_LOGO_URL,
    embeds: [
      {
        ...embed,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

async function sendDiscordPayload(webhookUrl, payload) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Discord webhook failed: ${response.status} ${responseBody}`,
    );
  }
}

function chunkForDiscord(value, maxLength) {
  if (value.length <= maxLength) return [value];

  const chunks = [];
  for (let index = 0; index < value.length; index += maxLength) {
    chunks.push(value.slice(index, index + maxLength));
  }

  return chunks;
}
