/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

import { getNotionClient } from "@/lib/notion";

/**
 * Webhook Handler for Notion "Database Rapat & Keputusan"
 *
 * When a meeting is created or updated, this endpoint:
 * 1. Extracts the list of invited persons (Daftar Undangan relation).
 * 2. Loops through each person and fetches their details.
 * 3. Creates a record in "Database Rekam Presensi" if it doesn't exist.
 * 4. Uses a handshake ID (meetingId_personId) to prevent duplicates.
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

    const results: any[] = [];

    // Process each person in the invited list
    for (const rel of invitationRelation) {
      const personId = rel.id;
      const handshakeId = `${meetingId}_${personId}`;

      try {
        // 1. Check for existing record to avoid duplicates
        const existing = await (notion.databases as any).query({
          database_id: presensiDbId,
          filter: {
            property: "id presensi",
            rich_text: {
              equals: handshakeId,
            },
          },
        });

        if (existing.results.length > 0) {
          results.push({
            personId,
            status: "exists",
            pageId: existing.results[0].id,
          });
          continue;
        }

        // 2. Retrieve person details from SDM Database (optional, for record title)
        let personName = "Peserta";
        try {
          const personPage = (await notion.pages.retrieve({
            page_id: personId,
          })) as any;
          // Look for title property (usually "Nama" or "Name")
          const titleProp = Object.values(personPage.properties).find(
            (p: any) => p.type === "title",
          ) as any;
          personName = titleProp?.title?.[0]?.plain_text || "Peserta";
        } catch (e) {
          console.error(`Failed to fetch details for person ${personId}:`, e);
        }

        // 3. Create a new entry in the "Database Rekam Presensi"
        // Note: property names "Name", "Rapat", and "SDM" are assumed defaults.
        const newPage = await notion.pages.create({
          parent: { database_id: presensiDbId },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: `Presensi: ${personName}`,
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
            // Link back to the SDM page
            SDM: {
              relation: [{ id: personId }],
            },
          },
        });

        results.push({ personId, status: "created", pageId: newPage.id });
      } catch (innerError) {
        console.error(`Error processing person ${personId}:`, innerError);
        results.push({ personId, status: "error", error: String(innerError) });
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
