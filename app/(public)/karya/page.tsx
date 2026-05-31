import { fetchKaryaEntries } from "@/lib/notion";
import KaryaView from "@/views/Karya";

export const revalidate = 0;

export default async function KaryaPage() {
  const entries = await fetchKaryaEntries();

  return <KaryaView entries={entries} />;
}
