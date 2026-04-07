import { fetchEventsCollection } from "@/lib/notion";
import EventsView from "@/views/Events";

export const revalidate = 60;

export default async function EventsPage() {
  const collection = await fetchEventsCollection();

  return <EventsView collection={collection} />;
}
