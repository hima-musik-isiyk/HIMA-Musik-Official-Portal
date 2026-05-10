/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getNotionClient, resolveDataSourceIdSafe } from "@/lib/notion";

/**
 * Webhook Handler for Notion "Database Rapat & Keputusan"
 *
 * When a meeting is created or updated, this endpoint:
 * 1. Extracts the list of invited attendees (Daftar Undangan relation).
 * 2. Loops through each attendee and fetches their details.
 * 3. Creates a record in "Database Rekam Presensi" if it doesn't exist.
 * 4. Uses a handshake ID (meetingId_attendeeId) to prevent duplicates.
 */

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/notion/sync-presensi",
    message: "Active. Waiting for POST requests from Notion Automation.",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log the payload for debugging (visible in terminal logs)
    console.warn(
      "🚀 [Notion Webhook] Incoming Payload:",
      JSON.stringify(body, null, 2),
    );

    const meetingId = body?.data?.id;
    // Extract relations from "Daftar Undangan" property
    const invitationRelation =
      body?.data?.properties?.["Daftar Undangan"]?.relation || [];

    if (!meetingId) {
      return NextResponse.json(
        { success: false, error: "Missing meeting ID (page ID)" },
        { status: 400 },
      );
    }

    const notion = getNotionClient();
    if (!notion) {
      return NextResponse.json(
        { success: false, error: "Notion client not initialized" },
        { status: 500 },
      );
    }

    const presensiDbId = process.env.NOTION_DATABASE_ID_PRESENSI;
    if (!presensiDbId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing NOTION_DATABASE_ID_PRESENSI in .env",
        },
        { status: 500 },
      );
    }

    // Resolve Database ID to Data Source ID for querying in 2026-03-11+
    const presensiDataSourceId = await resolveDataSourceIdSafe(presensiDbId);
    if (!presensiDataSourceId) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not resolve data source for database ${presensiDbId}. Check integration permissions.`,
        },
        { status: 500 },
      );
    }

    const results: any[] = [];

    // Process each attendee in the invited list
    for (const rel of invitationRelation) {
      const attendeeId = rel.id;
      const handshakeId = `${meetingId}_${attendeeId}`;

      try {
        // 1. Check for existing record to avoid duplicates using dataSources.query
        const existing = await (notion as any).dataSources.query({
          data_source_id: presensiDataSourceId,
          filter: {
            property: "id presensi",
            rich_text: {
              equals: handshakeId,
            },
          },
        });

        if (existing.results.length > 0) {
          results.push({
            attendeeId,
            status: "exists",
            pageId: existing.results[0].id,
          });
          continue;
        }

        // 2. Retrieve attendee details (pages in database, as clarified by user)
        let attendeeName = "Peserta";
        try {
          const attendeePage = (await notion.pages.retrieve({
            page_id: attendeeId,
          })) as any;
          // Look for title property (usually "Nama" or "Name")
          const titleProp = Object.values(attendeePage.properties).find(
            (p: any) => p.type === "title",
          ) as any;
          attendeeName = titleProp?.title?.[0]?.plain_text || "Peserta";
        } catch (e) {
          console.error(
            `Failed to fetch details for attendee ${attendeeId}:`,
            e,
          );
        }

        // 3. Create a new entry in the "Database Rekam Presensi"
        const newPage = await notion.pages.create({
          parent: { database_id: presensiDbId },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: `Presensi: ${attendeeName}`,
                  },
                },
              ],
            },
            "id presensi": {
              rich_text: [
                {
                  text: {
                    content: handshakeId,
                  },
                },
              ],
            },
            // Link back to the Rapat page
            Rapat: {
              relation: [{ id: meetingId }],
            },
            // Link back to the SDM page (attendee database)
            SDM: {
              relation: [{ id: attendeeId }],
            },
          },
        });

        results.push({ attendeeId, status: "created", pageId: newPage.id });
      } catch (innerError) {
        console.error(`Error processing attendee ${attendeeId}:`, innerError);
        results.push({
          attendeeId,
          status: "error",
          error: String(innerError),
        });
      }
    }

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
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
