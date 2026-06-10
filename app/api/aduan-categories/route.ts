import { NextResponse } from "next/server";

import { getNotionClient, resolveDataSourceIdSafe } from "@/lib/notion";

export const revalidate = 0; // Dynamic API route

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dbId = searchParams.get("dbId");
    if (!dbId) {
      return NextResponse.json({ error: "Missing dbId" }, { status: 400 });
    }

    const notion = getNotionClient();
    if (!notion) {
      return NextResponse.json(
        { error: "Notion client not initialized" },
        { status: 500 },
      );
    }

    const dataSourceId = await resolveDataSourceIdSafe(dbId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any[] = [];
    if (dataSourceId) {
      const response = await (
        notion as unknown as {
          dataSources: {
            query: (args: { data_source_id: string }) => Promise<{
              results: unknown[];
            }>;
          };
        }
      ).dataSources.query({
        data_source_id: dataSourceId,
      });
      results = response.results;
    } else {
      const response = await (notion as any).databases.query({
        database_id: dbId,
      });
      results = response.results;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = results.map((page: any) => {
      let name = "Untitled";
      const nameProp = page.properties.Name || page.properties.title;
      if (nameProp && nameProp.type === "title" && nameProp.title.length > 0) {
        name = nameProp.title.map((t: any) => t.plain_text).join("");
      }

      let order = 999;
      const orderProp = page.properties.Order;
      if (
        orderProp &&
        orderProp.type === "number" &&
        orderProp.number !== null
      ) {
        order = orderProp.number;
      }

      return {
        id: page.id,
        name: name,
        order: order,
      };
    });

    // Sort categories by Order ascending
    categories.sort((a, b) => a.order - b.order);

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Failed to fetch aduan categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
