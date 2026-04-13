import { fetchEventsCollection, fetchKKMGroups } from "@/lib/notion";
import EventsView from "@/views/Events";

export const revalidate = 60;

export default async function EventsPage() {
  const [collection, kkmGroups] = await Promise.all([
    fetchEventsCollection(),
    fetchKKMGroups(),
  ]);

  return <EventsView collection={collection} kkmGroups={kkmGroups} />;
}
