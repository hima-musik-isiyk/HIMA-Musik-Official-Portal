import { NextRequest, NextResponse } from "next/server";

import { calendar } from "@/lib/googleCalendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ ok: true });
}

async function resolveAttendeeEmails(
  relationItems: { id: string }[],
): Promise<string[]> {
  const emails: string[] = [];
  for (const item of relationItems) {
    const res = await fetch(`https://api.notion.com/v1/pages/${item.id}`, {
      headers: {
        Authorization: `Bearer ${process.env.NOTION_INTEGRATION_TOKEN}`,
        "Notion-Version": "2022-06-28",
      },
    });
    const page = await res.json();

    // In CMS SDM, the exact property name is "Email" with type "email"
    const emailProp =
      page.properties?.["Email"]?.email ??
      page.properties?.["Email"]?.rich_text?.[0]?.plain_text ??
      page.properties?.["Email Aktif"]?.email ??
      page.properties?.["Email Aktif"]?.rich_text?.[0]?.plain_text ??
      null;

    if (emailProp && emailProp.includes("@")) {
      emails.push(emailProp);
    }
  }
  return emails;
}

async function updateNotionCalendarId(pageId: string, eventId: string) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_INTEGRATION_TOKEN}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        "Calendar Event ID": {
          rich_text: [{ text: { content: eventId } }],
        },
      },
    }),
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const xAction = req.headers.get("x-action");

  // Step 1: Auth validation
  if (authHeader !== process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let namaEvent = "";

  try {
    const body = await req.json();

    // Step 3: Parse Notion payload
    const props = body.data?.properties || {};
    const pageId = body.data?.id;

    if (!pageId) {
      return NextResponse.json({ error: "No page ID found" }, { status: 400 });
    }

    namaEvent = props["Agenda Utama"]?.title?.[0]?.plain_text ?? "";
    const jadwal = props["Jadwal"]?.date;
    const lokasi = props["Lokasi Pertemuan"]?.rich_text?.[0]?.plain_text ?? "";
    const calId = props["Calendar Event ID"]?.rich_text?.[0]?.plain_text ?? "";
    const undangan = props["(AUT) Daftar Undangan"]?.relation ?? [];

    const startDateTime = jadwal?.start;
    if (!startDateTime) {
      return NextResponse.json({ error: "Jadwal kosong" }, { status: 400 });
    }
    const endDateTime = jadwal?.end ?? jadwal?.start;

    // Step 4 & 5: Build event payload
    const attendeeEmails = await resolveAttendeeEmails(undangan);
    const attendees = attendeeEmails.map((email) => ({ email }));

    const eventBody = {
      summary: namaEvent,
      location: lokasi || undefined,
      start: { dateTime: startDateTime, timeZone: "Asia/Jakarta" },
      end: { dateTime: endDateTime, timeZone: "Asia/Jakarta" },
      attendees,
      sendUpdates: "all" as const,
    };

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error("GOOGLE_CALENDAR_ID environment variable not set");
    }

    // Step 6: Route by x-action
    if (xAction === "update") {
      if (!calId) {
        // CREATE
        const res = await calendar.events.insert({
          calendarId,
          requestBody: eventBody,
        });
        if (res.data.id) {
          await updateNotionCalendarId(pageId, res.data.id);
        }
      } else {
        // UPDATE
        await calendar.events.patch({
          calendarId,
          eventId: calId,
          requestBody: eventBody,
        });
      }
    } else if (xAction === "delete") {
      if (!calId) {
        return NextResponse.json(
          {
            error:
              "Calendar Event ID tidak ditemukan. Sync dulu sebelum delete.",
          },
          { status: 400 },
        );
      }
      // DELETE
      await calendar.events.delete({
        calendarId,
        eventId: calId,
      });
      await updateNotionCalendarId(pageId, "");
    } else {
      return NextResponse.json(
        { error: "x-action tidak dikenal" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Step 8: Error handling
    console.error("Google Calendar API error:", err);

    if (process.env.DISCORD_ERROR_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_ERROR_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `❌ **Google Calendar error** [${xAction}] pada *${namaEvent}*\n\`\`\`${err.message}\`\`\``,
        }),
      });
    }

    return NextResponse.json(
      { error: "Google Calendar API gagal", detail: err.message },
      { status: 500 },
    );
  }
}
