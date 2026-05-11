/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getNotionClient, resolveDataSourceIdSafe } from "@/lib/notion";

// Global locks to prevent concurrent syncs for the same meeting
const syncLocks = new Map<string, Promise<any>>();

/**
 * Ensures that only one sync operation runs at a time for a given ID.
 */
async function withLock(id: string, task: () => Promise<any>) {
  // Wait if there's an ongoing sync for this meeting
  while (syncLocks.has(id)) {
    console.warn(`[Queue] Meeting ${id} is already syncing. Waiting...`);
    await syncLocks.get(id);
  }

  const promise = task();
  syncLocks.set(id, promise);

  try {
    return await promise;
  } finally {
    syncLocks.delete(id);
  }
}

async function getActiveMemberIds(
  notion: any,
  sdmDbId: string,
): Promise<Set<string>> {
  console.warn(
    "[Optimization] Fetching all active SDM members to avoid N+1 queries...",
  );
  const activeIds = new Set<string>();
  let cursor: string | undefined;

  try {
    do {
      const response = await notion.databases.query({
        database_id: sdmDbId,
        filter: {
          or: [
            {
              property: "Status Keaktifan",
              status: { equals: "Aktif" },
            },
            {
              property: "Status Keaktifan",
              select: { equals: "Aktif" },
            },
            {
              property: "Status Keaktifan",
              rich_text: { equals: "Aktif" },
            },
          ],
        },
        start_cursor: cursor,
        page_size: 100,
      });

      response.results.forEach((page: any) => activeIds.add(page.id));
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    console.warn(`[Optimization] Found ${activeIds.size} active members.`);
    return activeIds;
  } catch (error: any) {
    console.error(
      "[Optimization] Failed to fetch active members bulk:",
      error.message,
    );
    // Return empty set, fallback to individual check if absolutely necessary (though we want to avoid that)
    return activeIds;
  }
}

function findPropertyKey(properties: Record<string, any>, suffix: string) {
  return Object.keys(properties).find(
    (key) => key === suffix || key.endsWith(` ${suffix}`),
  );
}

/**
 * Webhook Handler for Notion "Database Rapat & Keputusan"
 *
 * When a meeting is created or updated, this endpoint:
 * 1. Extracts the list of invited attendees ((AUT) Daftar Undangan relation).
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
  const body = await req.json();
  const meetingId = body?.data?.id;

  if (!meetingId) {
    return NextResponse.json(
      { success: false, error: "Missing meeting ID (page ID)" },
      { status: 400 },
    );
  }

  // Wrap the entire processing logic in a lock based on meetingId
  return withLock(meetingId, async () => {
    try {
      // Log the payload for debugging
      console.warn(
        `🚀 [Notion Webhook] Processing Meeting: ${meetingId}`,
        JSON.stringify(body, null, 2),
      );

      const notion = getNotionClient();
      const presensiDbId = process.env.NOTION_DATABASE_ID_PRESENSI;
      const sdmDbId = process.env.NOTION_DATABASE_ID_SDM;

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
      const meetingPage = await notion.pages.retrieve({ page_id: meetingId });
      const meetingProperties = (meetingPage as any).properties ?? {};
      const meetingJadwalKey = findPropertyKey(meetingProperties, "Jadwal");
      const meetingJadwal = meetingJadwalKey
        ? meetingProperties[meetingJadwalKey]?.date?.start
        : undefined;

      const payloadProperties = body.data?.properties ?? {};
      const invitationPayloadKey = findPropertyKey(
        payloadProperties,
        "(AUT) Daftar Undangan",
      );
      const divisiPayloadKey = findPropertyKey(
        payloadProperties,
        "(AUT) Divisi Terlibat",
      );

      const meetingDivisiKey = findPropertyKey(
        meetingProperties,
        "(AUT) Divisi Terlibat",
      );
      const meetingInvitationKey = findPropertyKey(
        meetingProperties,
        "(AUT) Daftar Undangan",
      );
      const meetingKindKey = findPropertyKey(meetingProperties, "Kind");

      const { searchParams } = new URL(req.url);
      const kindFromUrl = searchParams.get("kind");
      const kindFromProp = meetingKindKey
        ? meetingProperties[meetingKindKey]?.rich_text?.[0]?.plain_text
        : undefined;
      let kind = kindFromUrl || kindFromProp;

      // Smart Inference Fallback
      if (!kind) {
        if (divisiPayloadKey) {
          kind = "(AUT) Divisi Terlibat";
        } else if (invitationPayloadKey) {
          kind = "(AUT) Daftar Undangan";
        }
      }

      const invitationRelation = invitationPayloadKey
        ? payloadProperties[invitationPayloadKey]?.relation || []
        : [];
      let finalInvitationIds = invitationRelation.map((r: any) => r.id);

      console.warn(`[Webhook] Automation Kind: ${kind || "Unknown"}`);

      // If this is a Division update, we need to populate the invitation list first
      if (kind === "(AUT) Divisi Terlibat" && sdmDbId) {
        const divisions = meetingDivisiKey
          ? meetingProperties[meetingDivisiKey]?.relation || []
          : [];
        const candidateMemberIds = new Set<string>(finalInvitationIds);

        // 1. Collect all member IDs from all involved divisions in parallel
        const divisionMembers = await Promise.all(
          divisions.map(async (div: any) => {
            try {
              const divPage = await notion.pages.retrieve({ page_id: div.id });
              return (
                (divPage as any).properties?.["Anggota Divisi"]?.relation?.map(
                  (r: any) => r.id,
                ) || []
              );
            } catch (e: any) {
              console.error(
                `[Webhook] Failed to fetch division ${div.id}:`,
                e.message,
              );
              return [];
            }
          }),
        );

        divisionMembers.flat().forEach((id) => candidateMemberIds.add(id));

        // 2. Batch check "Aktif" status for all candidates
        const activeMemberIds = await getActiveMemberIds(notion, sdmDbId);

        // 3. Filter candidates
        const validatedInvitationIds = Array.from(candidateMemberIds).filter(
          (id) => {
            if (activeMemberIds.has(id)) return true;
            console.warn(
              `[Webhook] Skipping non-active or missing member: ${id}`,
            );
            return false;
          },
        );

        finalInvitationIds = validatedInvitationIds;

        if (meetingInvitationKey) {
          await notion.pages.update({
            page_id: meetingId,
            properties: {
              [meetingInvitationKey]: {
                relation: finalInvitationIds.map((id) => ({ id })),
              },
            },
          });
          console.warn(
            `[Webhook] Expanded invitation list to ${finalInvitationIds.length} active members`,
          );
        }
      }

      // Sync attendees
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ [Notion Webhook] Error:", errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 },
      );
    }
  });
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
    // 1. Check for existing record
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

    // 2. Create entry
    const newPage = await notion.pages.create({
      parent: { database_id: presensiDbId },
      properties: {
        "ID Presensi": {
          title: [{ text: { content: handshakeId } }],
        },
        "Rapat Terkait": {
          relation: [{ id: meetingId }],
        },
        Peserta: {
          relation: [{ id: attendeeId }],
        },
        "Status Kehadiran": {
          status: { name: "Belum Hadir" },
        },
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

    for (const meeting of meetings) {
      const meetingId = meeting.id;
      const meetingTitleProp = Object.values(meeting.properties).find(
        (p: any) => p.type === "title",
      ) as any;
      const meetingName =
        meetingTitleProp?.title?.[0]?.plain_text || "Unnamed Meeting";

      const meetingInvitationKey = findPropertyKey(
        meeting.properties,
        "(AUT) Daftar Undangan",
      );
      const attendees = meetingInvitationKey
        ? meeting.properties[meetingInvitationKey]?.relation || []
        : [];
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
    const existingRecordsResponse = await (notion as any).dataSources.query({
      data_source_id: presensiDataSourceId,
      filter: {
        property: "Rapat Terkait",
        relation: { contains: meetingId },
      },
    });

    const existingRecords = existingRecordsResponse.results;
    const existingAttendeeMap = new Map();
    existingRecords.forEach((page: any) => {
      const attendeeRel = page.properties["Peserta"]?.relation?.[0]?.id;
      if (attendeeRel) {
        existingAttendeeMap.set(attendeeRel, page.id);
      }
    });

    const results: any[] = [];

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
