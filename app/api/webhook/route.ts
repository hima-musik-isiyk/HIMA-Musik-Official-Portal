/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";

const DISCORD_EMBED_LIMIT = 4096;
const DISCORD_FIELD_LIMIT = 1024;
const DISCORD_CODE_BLOCK_LIMIT = 4084;
const INSTAGRAM_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/132px-Instagram_logo_2016.svg.png";
const HIMA_INSTAGRAM_ID = process.env.HIMA_INSTAGRAM_ID;

const IDENTIFIER_ADJECTIVES = [
  "acoustic",
  "agile",
  "amber",
  "analog",
  "arcade",
  "azure",
  "bold",
  "bouncy",
  "brisk",
  "bright",
  "calm",
  "cedar",
  "clear",
  "cloudy",
  "cosmic",
  "crimson",
  "daring",
  "dusky",
  "electric",
  "faded",
  "fierce",
  "fluid",
  "gentle",
  "golden",
  "hollow",
  "honest",
  "ivory",
  "jolly",
  "kinetic",
  "lively",
  "lunar",
  "lush",
  "mellow",
  "minty",
  "neon",
  "nimble",
  "opal",
  "patient",
  "polished",
  "quick",
  "quiet",
  "radiant",
  "restless",
  "rosy",
  "silver",
  "sleepy",
  "solar",
  "steady",
  "tender",
  "tidy",
  "velvet",
  "vivid",
  "warm",
  "wild",
  "witty",
  "zesty",
];

const IDENTIFIER_NOUNS = [
  "amp",
  "anthem",
  "archive",
  "bassline",
  "beat",
  "bridge",
  "cadence",
  "chorus",
  "clef",
  "cymbal",
  "delay",
  "echo",
  "fader",
  "filter",
  "gain",
  "groove",
  "harmony",
  "hook",
  "jam",
  "kick",
  "lyric",
  "melody",
  "meter",
  "mixer",
  "motif",
  "octave",
  "pedal",
  "phrase",
  "pulse",
  "reverb",
  "riff",
  "scale",
  "signal",
  "snare",
  "spark",
  "stage",
  "studio",
  "tempo",
  "tone",
  "track",
  "tremolo",
  "verse",
  "vinyl",
  "vocal",
  "wave",
  "wire",
  "zine",
];

const FIELD_TITLES: Record<string, string> = {
  comments: "Instagram Comment",
  live_comments: "Instagram Live Comment",
  mentions: "Instagram Mention",
  message_edit: "Instagram Message Edited",
  message_reactions: "Instagram Message Reaction",
  messages: "Instagram DM",
  story_replies: "Instagram Story Reply",
  messaging_handover: "Instagram Messaging Handover",
  messaging_postbacks: "Instagram Postback",
  messaging_referral: "Instagram Referral",
  messaging_seen: "Instagram Seen",
  standby: "Instagram Standby",
  story_insights: "Instagram Story Insights",
};

const FIELD_COLORS: Record<string, number> = {
  comments: 0x833ab4,
  live_comments: 0xc13584,
  mentions: 0xf56040,
  message_edit: 0x5851db,
  message_reactions: 0xffdc80,
  messages: 0xe1306c,
  story_replies: 0xf56040,
  messaging_handover: 0x405de6,
  messaging_postbacks: 0x0099ff,
  messaging_referral: 0x00b894,
  messaging_seen: 0x2d3436,
  standby: 0x636e72,
  story_insights: 0xfd1d1d,
};

interface InstagramProfile {
  id: string;
  username?: string;
  name?: string;
  profile_pic?: string;
}

interface DiscordIdentity {
  username: string;
  avatarUrl: string;
}

interface WebhookContext {
  eventType: string;
  identifier: string;
  senderId?: string;
  senderProfile?: InstagramProfile | null;
  discordIdentity: DiscordIdentity;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isInstagramWebhookPayload(body)) {
      return new Response("EVENT_RECEIVED", { status: 200 });
    }

    try {
      await processInstagramWebhook(body);
    } catch (error) {
      console.error("Failed to process Instagram webhook:", error);
    }

    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response("EVENT_RECEIVED", { status: 200 });
  }
}

async function processInstagramWebhook(body: any) {
  const entries = Array.isArray(body.entry) ? body.entry : [];

  for (const entry of entries) {
    const context = await getEntryContext(entry);

    try {
      await sendRawToDiscord(entry, context);
    } catch (error) {
      console.error("Failed to send raw Instagram webhook:", error);
    }

    const embeds = await buildEmbedsForEntry(entry, context);

    for (const embed of embeds) {
      try {
        await sendParsedToDiscord(embed);
      } catch (error) {
        console.error("Failed to send parsed Instagram webhook:", error);
      }
    }
  }
}

function isInstagramWebhookPayload(body: any) {
  if (body?.object === "instagram") return true;

  const entries = Array.isArray(body?.entry) ? body.entry : [];
  return entries.some(
    (entry) =>
      Array.isArray(entry?.messaging) ||
      Array.isArray(entry?.changes) ||
      Array.isArray(entry?.standby),
  );
}

async function buildEmbedsForEntry(entry: any, context: WebhookContext) {
  return [
    ...(await buildMessagingEmbeds(entry, context)),
    ...buildChangeEmbeds(entry, context),
    ...buildStandbyEmbeds(entry, context),
  ];
}

async function buildMessagingEmbeds(entry: any, context: WebhookContext) {
  const messagingEvents = Array.isArray(entry.messaging) ? entry.messaging : [];
  const embeds: any[] = [];

  for (const event of messagingEvents) {
    const eventType = getMessagingEventType(event);
    const identifier = context.identifier;
    const himaSender = isHimaSender(entry, event);

    const senderProfile =
      context.senderId === event.sender?.id
        ? context.senderProfile
        : await fetchInstagramProfile(event.sender?.id);

    const discordIdentity = getDiscordIdentity({
      profile: senderProfile,
      fallback: identifier,
      isHima: himaSender,
    });

    const attachments = getMessageAttachments(event.message);
    const storyReply = getStoryReply(event.message);
    const imageAttachment = storyReply?.url
      ? { url: storyReply.url }
      : attachments.find(isDiscordImageAttachment);

    const title = himaSender
      ? formatHimaDiscordUsername(senderProfile)
      : identifier;

    const fields = [
      formatField(
        "From",
        himaSender
          ? formatHimaDiscordUsername(senderProfile)
          : formatProfile(senderProfile, event.sender?.id, {
              includeId: false,
            }),
        true,
      ),
      formatField("Event", formatEventLabel(eventType), true),
      formatField("Time", formatDisplayTime(event.timestamp), true),
      formatField("Story", formatStoryReply(storyReply), true),
      formatField(
        "Attachments",
        imageAttachment ? null : formatAttachments(attachments),
        false,
      ),
    ].filter(Boolean) as Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;

    embeds.push({
      title,
      webhookUsername: discordIdentity.username,
      webhookAvatarUrl: discordIdentity.avatarUrl,
      description: getMessagingDescription(event, eventType),
      color: FIELD_COLORS[eventType] ?? 0xe1306c,
      thumbnail: discordIdentity.avatarUrl
        ? { url: discordIdentity.avatarUrl }
        : undefined,
      image: imageAttachment ? { url: imageAttachment.url } : undefined,
      fields,
      footer: {
        text: "Instagram webhook",
      },
    });
  }

  return embeds;
}

function buildChangeEmbeds(entry: any, context: WebhookContext) {
  const changes = Array.isArray(entry.changes) ? entry.changes : [];

  return changes.map((change) => {
    const value = change.value ?? {};
    const fieldName = change.field ?? "unknown";
    const identifier = context.identifier;

    return {
      title: identifier,
      webhookUsername: identifier,
      description: getChangeDescription(fieldName, value),
      color: FIELD_COLORS[fieldName] ?? 0x833ab4,
      fields: [
        formatField("Event", formatEventLabel(fieldName), true),
        ...buildChangeDetailFields(fieldName, value),
      ].filter(Boolean) as Array<{
        name: string;
        value: string;
        inline?: boolean;
      }>,
      footer: {
        text: "Instagram webhook",
      },
    };
  });
}

function buildStandbyEmbeds(entry: any, context: WebhookContext) {
  const standbyEvents = Array.isArray(entry.standby) ? entry.standby : [];

  return standbyEvents.map((event) => {
    const identifier = context.identifier;

    return {
      title: identifier,
      webhookUsername: identifier,
      description: "Standby channel event received.",
      color: FIELD_COLORS.standby,
      fields: [
        formatField("Event", "Standby", true),
        formatField("Time", formatDisplayTime(event.timestamp), true),
      ].filter(Boolean) as Array<{
        name: string;
        value: string;
        inline?: boolean;
      }>,
      footer: {
        text: "Instagram webhook",
      },
    };
  });
}

function getMessagingEventType(event: any) {
  if (event.message?.is_deleted) return "message_edit";
  if (event.message?.reply_to?.story) return "story_replies";
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

function getMessagingDescription(event: any, eventType: string) {
  if (eventType === "messages") {
    return truncate(
      event.message?.text ||
        describeAttachments(event.message, { compact: true }),
      DISCORD_EMBED_LIMIT,
    );
  }

  if (eventType === "story_replies") {
    return truncate(
      `Replied to your story${event.message?.text ? `: ${event.message.text}` : "."}`,
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

function getChangeDescription(fieldName: string, value: any) {
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

function buildChangeDetailFields(fieldName: string, value: any) {
  if (fieldName === "comments" || fieldName === "live_comments") {
    return [
      formatField("From", formatUser(value.from), true),
      formatField("Message", value.text, false),
      formatField(
        "Ad",
        [value.ad_title, value.ad_id].filter(Boolean).join(" | "),
        true,
      ),
    ].filter(Boolean);
  }

  if (fieldName === "mentions") {
    return [formatField("Media ID", value.media_id, true)].filter(Boolean);
  }

  if (fieldName === "story_insights") {
    return [
      formatField("Impressions", value.impressions, true),
      formatField("Reach", value.reach, true),
      formatField("Replies", value.replies, true),
    ].filter(Boolean);
  }

  return [];
}

function formatField(name: string, value: any, inline = false) {
  if (value === undefined || value === null || value === "") return null;

  return {
    name,
    value: truncate(String(value), DISCORD_FIELD_LIMIT),
    inline,
  };
}

function formatUser(user: any) {
  if (!user) return null;
  const username = user.username ? `@${user.username}` : null;
  return [username, user.name].filter(Boolean).join(" | ");
}

function formatProfile(
  profile: any,
  fallbackId: string,
  options: { includeId?: boolean } = {},
) {
  const { includeId = true } = options;
  if (!profile) return includeId ? fallbackId : "Unknown Instagram user";
  const username = profile.username ? `@${profile.username}` : null;
  return [username, profile.name, includeId ? profile.id : null]
    .filter(Boolean)
    .join(" | ");
}

function describeAttachments(
  message: any,
  options: { compact?: boolean } = {},
) {
  const attachments = getMessageAttachments(message);
  if (!attachments.length) return null;

  if (options.compact && attachments.some(isDiscordImageAttachment)) {
    return "Sent an image.";
  }

  return attachments
    .map((attachment) =>
      [
        attachment.type,
        attachment.url,
        attachment.postId && `post:${attachment.postId}`,
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join("\n");
}

function getMessageAttachments(message: any) {
  const attachments = Array.isArray(message?.attachments)
    ? message.attachments
    : [];

  return attachments
    .map((attachment: any) => ({
      type: attachment.type ?? "attachment",
      url: attachment.payload?.url,
      postId: attachment.payload?.ig_post_media_id,
    }))
    .filter((attachment: any) => attachment.url || attachment.postId);
}

function formatAttachments(attachments: any[]) {
  if (!attachments.length) return null;

  return attachments
    .map((attachment) =>
      [
        attachment.type,
        attachment.url,
        attachment.postId && `post:${attachment.postId}`,
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");
}

function getStoryReply(message: any) {
  const story = message?.reply_to?.story;
  if (!story) return null;

  return {
    id: story.id,
    url: story.url,
  };
}

function formatStoryReply(story: any) {
  if (!story) return null;
  return story.id ? `ID: ${story.id}` : "Story";
}

function isDiscordImageUrl(url: string) {
  if (!url || typeof url !== "string") return false;
  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url);
}

function isDiscordImageAttachment(attachment: any) {
  return (
    Boolean(attachment?.url) &&
    (attachment.type === "image" || isDiscordImageUrl(attachment.url))
  );
}

function stringifyRawPayload(value: any) {
  return JSON.stringify(value, null, 2);
}

function formatDisplayTime(timestamp: any) {
  if (!timestamp) return null;
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return String(timestamp);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatEventLabel(eventType: string) {
  return FIELD_TITLES[eventType]?.replace("Instagram ", "") ?? eventType;
}

function truncate(value: string | null | undefined, maxLength: number) {
  if (!value) return value ?? "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function createEventIdentifier(entry: any, event: any, eventType: string) {
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
  return `${adjective}-${noun}`;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

async function fetchInstagramProfile(id: string) {
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

async function getEntryContext(entry: any): Promise<WebhookContext> {
  const primaryEvent = getPrimaryEvent(entry);
  const eventType = primaryEvent
    ? getEventType(primaryEvent)
    : entry?.changes?.[0]?.field || "instagram";
  const identifier = createEventIdentifier(
    entry,
    primaryEvent ?? entry,
    eventType,
  );
  const senderId =
    primaryEvent?.sender?.id || entry?.changes?.[0]?.value?.from?.id;
  const senderProfile = await fetchInstagramProfile(senderId);
  const himaSender = isHimaSender(entry, primaryEvent);
  const discordIdentity = getDiscordIdentity({
    profile: senderProfile,
    fallback: identifier,
    isHima: himaSender,
  });

  return {
    eventType,
    identifier,
    senderId,
    senderProfile,
    discordIdentity,
  };
}

function getPrimaryEvent(entry: any) {
  if (Array.isArray(entry.messaging) && entry.messaging[0]) {
    return entry.messaging[0];
  }

  if (Array.isArray(entry.changes) && entry.changes[0]) {
    return entry.changes[0];
  }

  if (Array.isArray(entry.standby) && entry.standby[0]) {
    return entry.standby[0];
  }

  return null;
}

function getEventType(event: any) {
  if (event?.field) return event.field;
  return getMessagingEventType(event);
}

function isHimaSender(entry: any, event: any) {
  const senderId = event?.sender?.id;
  if (!senderId) return false;

  return [entry?.id, process.env.INSTAGRAM_ACCOUNT_ID, HIMA_INSTAGRAM_ID]
    .filter(Boolean)
    .includes(senderId);
}

async function sendRawToDiscord(entry: any, context: WebhookContext) {
  const webhookUrl =
    process.env.DISCORD_RAW_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_RAW_URL;

  if (!webhookUrl) {
    console.warn("DISCORD_RAW_WEBHOOK_URL is not configured.");
    return;
  }

  const rawPayload = stringifyRawPayload(entry);

  for (const chunk of chunkForDiscord(rawPayload, DISCORD_CODE_BLOCK_LIMIT)) {
    await sendDiscordPayload(webhookUrl, {
      username: context.discordIdentity.username,
      avatar_url: context.discordIdentity.avatarUrl,
      embeds: [
        {
          title: context.identifier,
          description: `\`\`\`json\n${chunk}\n\`\`\``,
          color: FIELD_COLORS[context.eventType] ?? 0x5865f2,
          timestamp: new Date().toISOString(),
          footer: {
            text: formatProfile(context.senderProfile, "", {
              includeId: false,
            }),
          },
        },
      ],
    });
  }
}

async function sendParsedToDiscord(embed: any) {
  const webhookUrl = process.env.DISCORD_INSTAGRAM_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("DISCORD_INSTAGRAM_WEBHOOK_URL is not configured.");
    return;
  }

  const { webhookUsername, webhookAvatarUrl, ...discordEmbed } = embed;

  await sendDiscordPayload(webhookUrl, {
    username: webhookUsername ?? embed.title,
    avatar_url: webhookAvatarUrl ?? embed.thumbnail?.url ?? INSTAGRAM_LOGO_URL,
    embeds: [
      {
        ...discordEmbed,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

function formatDiscordUsername(profile: any, fallback: string) {
  return profile?.username ? `@${profile.username}` : fallback;
}

function getDiscordIdentity({
  profile,
  fallback,
  isHima,
}: {
  profile: any;
  fallback: string;
  isHima: boolean;
}): DiscordIdentity {
  if (isHima) {
    return {
      username: formatHimaDiscordUsername(profile),
      avatarUrl: profile?.profile_pic ?? INSTAGRAM_LOGO_URL,
    };
  }

  return {
    username: formatDiscordUsername(profile, fallback),
    avatarUrl: profile?.profile_pic ?? INSTAGRAM_LOGO_URL,
  };
}

function formatHimaDiscordUsername(profile: any) {
  return profile?.username ? `@${profile.username}` : "Instagram Account";
}

async function sendDiscordPayload(webhookUrl: string, payload: any) {
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

function chunkForDiscord(value: string, maxLength: number) {
  if (value.length <= maxLength) return [value];

  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += maxLength) {
    chunks.push(value.slice(index, index + maxLength));
  }

  return chunks;
}
