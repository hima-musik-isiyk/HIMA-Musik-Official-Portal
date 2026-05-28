import { NextResponse } from "next/server";

import {
  handleNotionRoomWebhook,
  handleNotionRoomWebhookHealthcheck,
} from "@/lib/notion-room/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleNotionRoomWebhookHealthcheck;

function extractPropertyValue(prop: any): any {
  if (!prop) return "";
  if (typeof prop === "string") return prop;
  if (typeof prop !== "object") return prop;

  switch (prop.type) {
    case "title":
      return prop.title?.map((t: any) => t.plain_text).join("") || "";
    case "rich_text":
      return prop.rich_text?.map((t: any) => t.plain_text).join("") || "";
    case "status":
      return prop.status?.name || "";
    case "select":
      return prop.select?.name || "";
    case "multi_select":
      return prop.multi_select?.map((s: any) => s.name) || [];
    case "date":
      if (!prop.date) return "";
      return prop.date.end
        ? `${prop.date.start} -> ${prop.date.end}`
        : prop.date.start;
    case "checkbox":
      return prop.checkbox;
    case "number":
      return prop.number;
    case "url":
      return prop.url || "";
    case "email":
      return prop.email || "";
    case "phone_number":
      return prop.phone_number || "";
    case "created_time":
      return prop.created_time || "";
    case "last_edited_time":
      return prop.last_edited_time || "";
    case "created_by":
      return prop.created_by?.name || prop.created_by?.id || "";
    case "last_edited_by":
      return prop.last_edited_by?.name || prop.last_edited_by?.id || "";
    case "people":
      return prop.people?.map((p: any) => p.name || p.id).join(", ") || "";
    case "files":
      return (
        prop.files?.map((f: any) => {
          if (f.type === "external") return f.external.url;
          if (f.type === "file") return f.file.url;
          return f.name;
        }) || []
      );
    default:
      return JSON.stringify(prop);
  }
}

export async function POST(request: Request) {
  // Read request body to determine if this is an Agenda database webhook submission
  let body: any;
  try {
    const clonedRequest = request.clone();
    body = await clonedRequest.json();
  } catch (error) {
    console.error("Error reading webhook body:", error);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Intercept the request if it is an Agenda database submission.
  // We can look for common properties of the Agenda form database inside page properties
  const props = body.data?.properties || body.properties || body;

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
    const namaAcara = extractPropertyValue(
      props["Nama Acara"] || props.NamaAcara || props.Nama_Acara || "—",
    );
    const status = extractPropertyValue(props["Status"] || "—");
    const slug = extractPropertyValue(
      props["Request Slug Khusus"] || props.RequestSlugKhusus || "—",
    );
    const eventDate = extractPropertyValue(
      props["Tanggal Acara"] || props.TanggalAcara || "—",
    );
    const deskripsi = extractPropertyValue(
      props["Deskripsi Singkat Acara"] || props.DeskripsiSingkatAcara || "—",
    );
    const kkmPengusul = extractPropertyValue(
      props["KKM Pengusul"] || props.KKMPengusul || "—",
    );
    const lokasi = extractPropertyValue(
      props["Lokasi Acara"] || props.LokasiAcara || "—",
    );
    const respondent = extractPropertyValue(props["Respondent"] || "—");

    const submissionTimeProp =
      props["Submission time"] || props.SubmissionTime || props.submission_time;
    const submissionTime = submissionTimeProp
      ? extractPropertyValue(submissionTimeProp)
      : new Date().toISOString();

    const gambarFiles = props["Gambar"] || props.Gambar || [];
    const gambarList = Array.isArray(gambarFiles) ? gambarFiles : [gambarFiles];
    const imageUrl = extractPropertyValue(gambarList[0]);

    // Construct a gorgeous Discord Embed
    const discordWebhookUrl =
      process.env.DISCORD_AGENDA_WEBHOOK_URL ||
      "https://discord.com/api/webhooks/1509555221729120448/yVID-vj0yIzJJASwmShviUp9yTjH1TeSfclC9-lvusqcFTFFrQHGA-z77WK2nQ9NDo93";

    const embed: any = {
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
  return handleNotionRoomWebhook(request);
}
