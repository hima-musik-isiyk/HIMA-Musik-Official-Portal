/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getNotionClient, resolveDataSourceIdSafe } from "@/lib/notion";

async function isActiveSdmMember(notion: any, pageId: string) {
  try {
    const memberPage = await notion.pages.retrieve({ page_id: pageId });
    const statusProperty = memberPage?.properties?.["Status Keaktifan"];

    const statusValue =
      statusProperty?.select?.name ||
      statusProperty?.status?.name ||
      statusProperty?.rich_text?.[0]?.plain_text ||
      "";

    return statusValue === "Aktif";
  } catch (error: any) {
    console.error(
      `[Webhook] Failed to resolve Status Keaktifan for member ${pageId}:`,
      error?.message ?? error,
    );
    return false;
  }
}

/**
 * Webhook Handler for Notion "Database Rapat & Keputusan"
 *
 * When a meeting is created or updated, this endpoint:
 * 1. Extracts the list of invited attendees (Daftar Undangan relation).
 * 2. Loops through each attendee and fetches their details.
 * 3. Creates a record in "Database Rekam Presensi" if it doesn't exist.
 * 4. Uses a handshake ID (meetingId_attendeeId) to prevent duplicates.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isBulk = searchParams.get("bulk") === "true";

  if (isBulk) {
    return handleBulkSync();
  }

  return NextResponse.json({
    status: "active",
    endpoint: "/api/notion/sync-presensi",
    message:
      "To trigger a bulk sync of ALL meetings, call GET /api/notion/sync-presensi?bulk=true",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log the payload for debugging
    console.warn(
      "🚀 [Notion Webhook] Incoming Payload:",
      JSON.stringify(body, null, 2),
    );

    const meetingId = body?.data?.id;
    const invitationRelation =
      body?.data?.properties?.["Daftar Undangan"]?.relation || [];

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: "Missing meeting ID (page ID)" },
        { status: 400 },
      );
    }

    const notion = getNotionClient();
    const presensiDbId = process.env.NOTION_DATABASE_ID_PRESENSI;

    if (!notion || !presensiDbId) {
      return NextResponse.json(
        { success: false, error: "Missing Notion client or Database ID" },
        { status: 500 },
      );
    }

    const presensiDataSourceId = await resolveDataSourceIdSafe(presensiDbId);
    if (!presensiDataSourceId) {
      return NextResponse.json(
        { error: "Could not resolve Presensi data source" },
        { status: 500 },
      );
    }

    // Fetch the meeting details to get the 'Jadwal' (Schedule)
    // We fetch it because webhooks often don't include all properties in the payload
    const meetingPage = await notion.pages.retrieve({ page_id: meetingId });
    const meetingJadwal = (meetingPage as any).properties?.["Jadwal"]?.date
      ?.start;

    // Get the automation 'kind' (intention)
    // First check search params (from webhook URL), then fallback to page properties
    const { searchParams } = new URL(req.url);
    const kindFromUrl = searchParams.get("kind");
    const kindFromProp = (meetingPage as any).properties?.["Kind"]
      ?.rich_text?.[0]?.plain_text;
    let kind = kindFromUrl || kindFromProp;

    // Smart Inference Fallback:
    // If kind is unknown, check which properties are in the payload to guess the intention
    if (!kind) {
      if (body.data.properties?.["Divisi Terlibat"]) {
        kind = "Divisi Terlibat";
      } else if (body.data.properties?.["Daftar Undangan"]) {
        kind = "Daftar Undangan";
      }
    }

    let finalInvitationIds = invitationRelation.map((r: any) => r.id);

    console.warn(`[Webhook] Automation Kind: ${kind || "Unknown"}`);

    // If this is a Division update, we need to populate the invitation list first
    if (kind === "Divisi Terlibat") {
      const divisions =
        (meetingPage as any).properties?.["Divisi Terlibat"]?.relation || [];
      const newMemberIds = new Set<string>(finalInvitationIds);

      for (const div of divisions) {
        try {
          const divPage = await notion.pages.retrieve({ page_id: div.id });
          const members =
            (divPage as any).properties?.["Anggota Divisi"]?.relation || [];

          for (const member of members) {
            const memberId = member.id;
            if (!memberId) continue;

            const isActive = await isActiveSdmMember(notion, memberId);
            if (isActive) {
              newMemberIds.add(memberId);
            } else {
              console.warn(
                `[Webhook] Skipping non-active SDM/Evaluasi member ${memberId}`,
              );
            }
          }
        } catch (e: any) {
          console.error(
            `[Webhook] Failed to fetch members for division ${div.id}:`,
            e.message,
          );
        }
      }

      finalInvitationIds = Array.from(newMemberIds);

      // Update the meeting page with the expanded invitation list
      await notion.pages.update({
        page_id: meetingId,
        properties: {
          "Daftar Undangan": {
            relation: finalInvitationIds.map((id) => ({ id })),
          },
        },
      });
      console.warn(
        `[Webhook] Expanded invitation list to ${finalInvitationIds.length} active members`,
      );
    }

    // Sync attendees (Add missing, Remove deleted)
    const results = await syncMeetingAttendees(
      notion,
      meetingId,
      finalInvitationIds,
      presensiDbId,
      presensiDataSourceId,
      meetingJadwal,
    );

    return NextResponse.json({
      success: true,
      meetingId,
      processed: invitationRelation.length,
      results,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [Notion Webhook] Error:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

/**
 * Shared logic to sync a single attendee for a specific meeting
 */
async function syncAttendee(
  notion: any,
  meetingId: string,
  attendeeId: string,
  presensiDbId: string,
  presensiDataSourceId: string,
  meetingJadwal?: string,
) {
  const handshakeId = `${meetingId}_${attendeeId}`;

  try {
    // 1. Check for existing record — ID Presensi is the TITLE field
    let existing: any;
    try {
      existing = await (notion as any).dataSources.query({
        data_source_id: presensiDataSourceId,
        filter: {
          property: "ID Presensi",
          title: { equals: handshakeId },
        },
      });
    } catch (e: any) {
      console.error("[syncAttendee] dataSources.query failed:", e.message);
      throw e;
    }

    if (existing?.results?.length > 0) {
      return { attendeeId, status: "exists", pageId: existing.results[0].id };
    }

    // 3. Create entry with correct property names from actual Notion schema
    const newPage = await notion.pages.create({
      parent: { database_id: presensiDbId },
      properties: {
        // Title field is "ID Presensi" — used as the handshake identifier
        "ID Presensi": {
          title: [{ text: { content: handshakeId } }],
        },
        // Relation back to the Rapat (meeting) page
        "Rapat Terkait": {
          relation: [{ id: meetingId }],
        },
        // Relation back to the SDM/person page
        Peserta: {
          relation: [{ id: attendeeId }],
        },
        // Default status
        "Status Kehadiran": {
          status: { name: "Belum Hadir" },
        },
        // Pre-fill arrival time with the meeting's scheduled time
        ...(meetingJadwal
          ? {
              "Waktu Kedatangan": {
                date: { start: meetingJadwal },
              },
            }
          : {}),
      },
    });

    return { attendeeId, status: "created", pageId: newPage.id };
  } catch (error: any) {
    console.error(`Error processing attendee ${attendeeId}:`, error);
    return { attendeeId, status: "error", error: error.message };
  }
}

/**
 * Bulk sync: Loops through ALL meetings in the Rapat database
 * and ensures every attendee has a Presensi record.
 */
async function handleBulkSync() {
  try {
    const notion = getNotionClient();
    const rapatDbId = process.env.NOTION_DATABASE_ID_RAPAT;
    const presensiDbId = process.env.NOTION_DATABASE_ID_PRESENSI;

    if (!notion || !rapatDbId || !presensiDbId) {
      throw new Error("Missing Notion client or Database IDs in .env");
    }

    const rapatDataSourceId = await resolveDataSourceIdSafe(rapatDbId);
    const presensiDataSourceId = await resolveDataSourceIdSafe(presensiDbId);

    if (!rapatDataSourceId || !presensiDataSourceId) {
      throw new Error("Could not resolve data sources for bulk sync");
    }

    // 1. Fetch all meetings (paginated)
    let cursor: string | undefined;
    const meetings: any[] = [];
    do {
      const response = await (notion as any).dataSources.query({
        data_source_id: rapatDataSourceId,
        start_cursor: cursor,
      });
      meetings.push(...response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    console.warn(`[Bulk Sync] Found ${meetings.length} meetings to process.`);

    const overallResults: any[] = [];

    // 2. Process each meeting
    for (const meeting of meetings) {
      const meetingId = meeting.id;
      // Get meeting name for logging
      const meetingTitleProp = Object.values(meeting.properties).find(
        (p: any) => p.type === "title",
      ) as any;
      const meetingName =
        meetingTitleProp?.title?.[0]?.plain_text || "Unnamed Meeting";

      const attendees = meeting.properties?.["Daftar Undangan"]?.relation || [];
      console.warn(
        `[Bulk Sync] Processing "${meetingName}" (${attendees.length} attendees)`,
      );

      const meetingResults = await syncMeetingAttendees(
        notion,
        meetingId,
        attendees.map((r: any) => r.id),
        presensiDbId,
        presensiDataSourceId,
        meeting.properties?.["Jadwal"]?.date?.start,
      );
      overallResults.push({
        meetingName,
        meetingId,
        results: meetingResults,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${meetings.length} meetings.`,
      details: overallResults,
    });
  } catch (error: any) {
    console.error("❌ [Bulk Sync] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/**
 * Syncs the entire attendee set for a meeting: Adds new, Removes deleted.
 */
async function syncMeetingAttendees(
  notion: any,
  meetingId: string,
  targetAttendeeIds: string[],
  presensiDbId: string,
  presensiDataSourceId: string,
  meetingJadwal?: string,
) {
  try {
    // 1. Fetch ALL current records for this meeting in Rekam Presensi DB
    // Use the relation property to find all records linked to this meeting
    const existingRecordsResponse = await (notion as any).dataSources.query({
      data_source_id: presensiDataSourceId,
      filter: {
        property: "Rapat Terkait",
        relation: { contains: meetingId },
      },
    });

    const existingRecords = existingRecordsResponse.results;

    // Map existing records to Peserta IDs (attendeeId -> pageId)
    const existingAttendeeMap = new Map();
    existingRecords.forEach((page: any) => {
      // Find the "Peserta" relation property
      const attendeeRel = page.properties["Peserta"]?.relation?.[0]?.id;
      if (attendeeRel) {
        existingAttendeeMap.set(attendeeRel, page.id);
      }
    });

    const results: any[] = [];

    // 2. Addition Sync: Add missing attendees
    for (const attendeeId of targetAttendeeIds) {
      if (!existingAttendeeMap.has(attendeeId)) {
        const result = await syncAttendee(
          notion,
          meetingId,
          attendeeId,
          presensiDbId,
          presensiDataSourceId,
          meetingJadwal,
        );
        results.push(result);
      } else {
        results.push({
          attendeeId,
          status: "exists",
          pageId: existingAttendeeMap.get(attendeeId),
        });
      }
    }

    // 3. Removal Sync: Archive records that are no longer in the invitation list
    for (const [attendeeId, pageId] of existingAttendeeMap.entries()) {
      if (!targetAttendeeIds.includes(attendeeId)) {
        try {
          await notion.pages.update({
            page_id: pageId,
            in_trash: true,
          });
          results.push({ attendeeId, status: "removed", pageId });
          console.warn(
            `[Sync] Removed attendee ${attendeeId} from meeting ${meetingId}`,
          );
        } catch (e: any) {
          console.error(
            `[Sync] Failed to remove attendee ${attendeeId}:`,
            e.message,
          );
          results.push({
            attendeeId,
            status: "error_removing",
            error: e.message,
          });
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error("[syncMeetingAttendees] Critical Error:", error.message);
    throw error;
  }
}
