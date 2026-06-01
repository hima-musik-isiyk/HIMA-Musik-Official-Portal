import { NextResponse } from "next/server";

import { generateKaryaEmailTemplate, sendBrevoEmail } from "@/lib/brevo";
import { DiscordEmbed } from "@/lib/discord";
import { inferScopes, revalidateScope } from "@/lib/notion-revalidate-helper";
import {
  handleNotionRoomWebhook,
  handleNotionRoomWebhookHealthcheck,
} from "@/lib/notion-room/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleNotionRoomWebhookHealthcheck;

function extractPropertyValue(prop: unknown): unknown {
  if (!prop) return "";
  if (typeof prop === "string") return prop;
  if (typeof prop !== "object") return prop;

  const p = prop as Record<string, unknown>;
  switch (p.type) {
    case "title":
      return (
        (p.title as { plain_text: string }[])
          ?.map((t) => t.plain_text)
          .join("") || ""
      );
    case "rich_text":
      return (
        (p.rich_text as { plain_text: string }[])
          ?.map((t) => t.plain_text)
          .join("") || ""
      );
    case "status":
      return (p.status as { name: string })?.name || "";
    case "select":
      return (p.select as { name: string })?.name || "";
    case "multi_select":
      return (p.multi_select as { name: string }[])?.map((s) => s.name) || [];
    case "date":
      if (!p.date) return "";
      const d = p.date as { start: string; end?: string };
      return d.end ? `${d.start} -> ${d.end}` : d.start;
    case "checkbox":
      return p.checkbox;
    case "number":
      return p.number;
    case "url":
      return p.url || "";
    case "email":
      return p.email || "";
    case "phone_number":
      return p.phone_number || "";
    case "created_time":
      return p.created_time || "";
    case "last_edited_time":
      return p.last_edited_time || "";
    case "created_by":
      const cb = p.created_by as { name?: string; id?: string };
      return cb?.name || cb?.id || "";
    case "last_edited_by":
      const leb = p.last_edited_by as { name?: string; id?: string };
      return leb?.name || leb?.id || "";
    case "people":
      return (
        (p.people as { name?: string; id: string }[])
          ?.map((pe) => pe.name || pe.id)
          .join(", ") || ""
      );
    case "files":
      return (
        (
          p.files as {
            type: string;
            name: string;
            external?: { url: string };
            file?: { url: string };
          }[]
        )?.map((f) => {
          if (f.type === "external" && f.external) return f.external.url;
          if (f.type === "file" && f.file) return f.file.url;
          return f.name;
        }) || []
      );
    default:
      return JSON.stringify(prop);
  }
}

export async function POST(request: Request) {
  const clonedRequest = request.clone();

  // Read request body to determine if this is a database webhook submission
  let body: Record<string, unknown> & {
    data?: { properties?: Record<string, unknown> };
    properties?: Record<string, unknown>;
  } = {};
  try {
    body = await clonedRequest.json();
  } catch (error) {
    console.error("Error reading webhook body:", error);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const props = (body.data?.properties || body.properties || body) as Record<
    string,
    unknown
  >;

  // Intercept if it is a Karya database submission
  const hasKaryaProps =
    props &&
    (props["Band/Artist dan Judul Karya / Tayangan"] ||
      props.BandArtistDanJudulKaryaTayangan ||
      props["Pencipta / Penampil"] ||
      props.PenciptaPenampil ||
      props["Link Embed Utama (Full URL)"] ||
      props.LinkEmbedUtamaFullURL);

  if (hasKaryaProps) {
    console.warn(
      "Karya form webhook submission detected. Processing notification and email...",
    );

    const title = String(
      extractPropertyValue(
        props["Band/Artist dan Judul Karya / Tayangan"] ||
          props.BandArtistDanJudulKaryaTayangan ||
          "—",
      ),
    );
    const creator = String(
      extractPropertyValue(
        props["Pencipta / Penampil"] || props.PenciptaPenampil || "—",
      ),
    );
    const nim = String(
      extractPropertyValue(
        props["NIM Penanggung Jawab"] || props.NIMPenanggungJawab || "—",
      ),
    );
    const rawPlatforms = extractPropertyValue(
      props["Platform Utama"] || props.PlatformUtama || [],
    );
    const platform = Array.isArray(rawPlatforms)
      ? rawPlatforms.join(", ")
      : String(rawPlatforms || "—");
    const rawGenres = extractPropertyValue(
      props["Genre / Jenis Karya"] || props.GenreJenisKarya || [],
    );
    const genres = Array.isArray(rawGenres)
      ? rawGenres.join(", ")
      : String(rawGenres || "—");
    const embedLink = String(
      extractPropertyValue(
        props["Link Embed Utama (Full URL)"] ||
          props.LinkEmbedUtamaFullURL ||
          "—",
      ),
    );
    const email = String(
      extractPropertyValue(props["Email"] || props.Email || ""),
    );
    const status = String(extractPropertyValue(props["Status"] || "—"));
    const respondent = String(extractPropertyValue(props["Respondent"] || "—"));

    const submissionTimeProp =
      props["Submission time"] || props.SubmissionTime || props.submission_time;
    const submissionTime = submissionTimeProp
      ? String(extractPropertyValue(submissionTimeProp))
      : new Date().toISOString();

    // 1. Send Discord Notification if configured
    const discordWebhookUrl =
      process.env.DISCORD_KARYA_WEBHOOK_URL ||
      "https://discord.com/api/webhooks/1509621771136012391/HubUQorPzJOhOnODs6xJQtiei1gpE2e6cEuQzX019NNEfLYpuBDB9Ik98X_ZgPOGqk2H";
    if (discordWebhookUrl) {
      const embed: DiscordEmbed = {
        title: `🎨 Karya Baru Diajukan: ${title}`,
        color: 0x3b82f6,
        fields: [
          {
            name: "👤 Pencipta / Penampil",
            value: creator || "—",
            inline: true,
          },
          {
            name: "🎓 NIM Penanggung Jawab",
            value: nim || "—",
            inline: true,
          },
          { name: "📧 Email", value: email || "—", inline: true },
          { name: "🎵 Platform Utama", value: platform || "—", inline: true },
          {
            name: "🎨 Genre / Jenis Karya",
            value: genres || "—",
            inline: true,
          },
          { name: "🔗 Tautan Embed", value: embedLink || "—", inline: false },
          { name: "📌 Status", value: status || "—", inline: true },
          {
            name: "🕒 Submission Time",
            value: submissionTime || "—",
            inline: true,
          },
          { name: "Respondent", value: respondent || "—", inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: "HIMA Musik Official Portal Webhook Handler",
        },
      };

      try {
        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [embed],
          }),
        });
        console.warn("Karya Discord notification sent successfully!");
      } catch (discordError) {
        console.error(
          "Failed to send Karya notification to Discord:",
          discordError,
        );
      }
    }

    // 2. Send Respondent Email Copy via Brevo
    if (email && email.trim() !== "" && email.includes("@")) {
      try {
        const htmlContent = generateKaryaEmailTemplate({
          title,
          creator,
          nim,
          platform,
          genres,
          embedLink,
          status,
          submissionTime,
        });

        await sendBrevoEmail({
          to: email,
          subject: `Salinan Pengajuan Karya HIMA: ${title}`,
          htmlContent,
        });
      } catch (emailError) {
        console.error(
          "Failed to send submission email copy via Brevo:",
          emailError,
        );
      }
    }

    // 3. Revalidate karya cache
    try {
      revalidateScope("karya");
      console.warn("[Notion Webhook] Revalidated karya for form submission.");
    } catch (revalErr) {
      console.error(
        "[Notion Webhook] Failed to revalidate karya scope:",
        revalErr,
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Karya submission processed successfully (Discord + Email)",
    });
  }

  // Intercept the request if it is an Agenda database submission.
  const hasAgendaProps =
    props &&
    (props["Nama Acara"] ||
      props.NamaAcara ||
      props.Nama_Acara ||
      props["Tanggal Acara"] ||
      props.TanggalAcara);

  if (hasAgendaProps) {
    console.warn(
      "Agenda form webhook submission detected. Processing notification...",
    );

    // Extract property values cleanly
    const namaAcara = String(
      extractPropertyValue(
        props["Nama Acara"] || props.NamaAcara || props.Nama_Acara || "—",
      ),
    );
    const status = String(extractPropertyValue(props["Status"] || "—"));
    const slug = String(
      extractPropertyValue(
        props["Request Slug Khusus"] || props.RequestSlugKhusus || "—",
      ),
    );
    const eventDate = String(
      extractPropertyValue(props["Tanggal Acara"] || props.TanggalAcara || "—"),
    );
    const deskripsi = String(
      extractPropertyValue(
        props["Deskripsi Singkat Acara"] || props.DeskripsiSingkatAcara || "—",
      ),
    );
    const kkmPengusul = String(
      extractPropertyValue(props["KKM Pengusul"] || props.KKMPengusul || "—"),
    );
    const lokasi = String(
      extractPropertyValue(props["Lokasi Acara"] || props.LokasiAcara || "—"),
    );
    const respondent = String(extractPropertyValue(props["Respondent"] || "—"));

    const submissionTimeProp =
      props["Submission time"] || props.SubmissionTime || props.submission_time;
    const submissionTime = submissionTimeProp
      ? String(extractPropertyValue(submissionTimeProp))
      : new Date().toISOString();

    const gambarFiles = props["Gambar"] || props.Gambar || [];
    const gambarList = Array.isArray(gambarFiles) ? gambarFiles : [gambarFiles];
    const imageUrl = String(extractPropertyValue(gambarList[0]) || "");

    // Construct a gorgeous Discord Embed
    const discordWebhookUrl =
      process.env.DISCORD_AGENDA_WEBHOOK_URL ||
      "https://discord.com/api/webhooks/1509555221729120448/yVID-vj0yIzJJASwmShviUp9yTjH1TeSfclC9-lvusqcFTFFrQHGA-z77WK2nQ9NDo93";

    const embed: DiscordEmbed = {
      title: `📅 Agenda Baru Diajukan: ${namaAcara}`,
      description:
        deskripsi && deskripsi !== "—"
          ? deskripsi.length > 200
            ? deskripsi.slice(0, 197) + "..."
            : deskripsi
          : "Tidak ada deskripsi singkat.",
      color: 0xd4a64d, // Gold
      fields: [
        { name: "👤 Pengusul KKM", value: kkmPengusul || "—", inline: true },
        { name: "📍 Lokasi Acara", value: lokasi || "—", inline: true },
        { name: "📅 Tanggal Acara", value: eventDate || "—", inline: true },
        { name: "🔗 Request Slug", value: slug || "—", inline: true },
        { name: "📌 Status", value: status || "—", inline: true },
        {
          name: "🕒 Submission Time",
          value: submissionTime || "—",
          inline: true,
        },
        { name: "Respondent", value: respondent || "—", inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "HIMA Musik Official Portal Webhook Handler",
      },
    };

    if (
      imageUrl &&
      typeof imageUrl === "string" &&
      imageUrl.startsWith("http")
    ) {
      embed.image = { url: imageUrl };
    }

    try {
      const response = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord returned status ${response.status}`);
      }

      console.warn("Discord notification sent successfully!");

      // Revalidate events cache on new submissions
      try {
        revalidateScope("events");
        console.warn(
          "[Notion Webhook] Revalidated agenda/events for form submission.",
        );
      } catch (revalErr) {
        console.error(
          "[Notion Webhook] Failed to revalidate agenda/events:",
          revalErr,
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Agenda submission forwarded to Discord",
      });
    } catch (discordError) {
      console.error("Failed to send notification to Discord:", discordError);
      return NextResponse.json(
        { ok: false, error: "Failed to forward notification to Discord" },
        { status: 500 },
      );
    }
  }

  // Fallback to internal room sync webhooks if it's not an agenda database submission
  const roomResponse = await handleNotionRoomWebhook(request);

  // Revalidate other scopes for standard CMS updates
  try {
    const payload = await clonedRequest.json().catch(() => null);
    if (payload) {
      const scopes = await inferScopes(payload);
      if (scopes && scopes.length > 0) {
        console.warn(
          `[Notion CMS Webhook] Revalidating scopes: ${scopes.join(", ")}`,
        );
        for (const scope of scopes) {
          try {
            revalidateScope(scope);
          } catch (revalError) {
            console.error(
              `[Notion CMS Webhook] Failed to revalidate scope ${scope}:`,
              revalError,
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("[Notion CMS Webhook] Revalidation failed:", error);
  }

  return roomResponse;
}
