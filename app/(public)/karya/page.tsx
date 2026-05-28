import { fetchKaryaEntries } from "@/lib/notion";
import KaryaView from "@/views/Karya";

export const revalidate = 60;

export default async function KaryaPage() {
  const entries = await fetchKaryaEntries();

  return <KaryaView entries={entries} />;
}
