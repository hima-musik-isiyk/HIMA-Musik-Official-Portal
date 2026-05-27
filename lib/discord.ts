export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
};

export type DiscordWebhookPayload = {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
  allowed_mentions?: {
    parse?: string[];
  };
};

/**
 * Centrally forwards a notification payload to a specified Discord Webhook URL.
 */
export async function sendDiscordWebhook(
  webhookUrl: string | undefined,
  payload: DiscordWebhookPayload,
  context = "Discord Webhook Notification",
): Promise<void> {
  if (!webhookUrl) {
    console.warn(
      `[Discord Helper] Skipping send: Webhook URL is undefined for context "${context}"`,
    );
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(
        `Discord API responded with status ${response.status}: ${responseText || "No response body"}`,
      );
    }
  } catch (error) {
    console.error(`[Discord Helper] Error in ${context}:`, error);
    throw error;
  }
}
