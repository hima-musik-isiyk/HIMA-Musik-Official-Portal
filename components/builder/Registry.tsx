"use client";

import { GenericButton } from "./core/GenericButton";
import { GenericButtonSpan } from "./core/GenericButtonSpan";
import { GenericCopy } from "./core/GenericCopy";
import { GenericDescription } from "./core/GenericDescription";
import { GenericLineTitle } from "./core/GenericLineTitle";
import { GenericTitle } from "./core/GenericTitle";
import { AduanForm } from "./special/AduanForm";
import { KaryaGrid } from "./special/KaryaGrid";
import PanduanDivisi from "./special/PanduanDivisi";
import PendaftaranChecklists from "./special/PendaftaranChecklists";
import {
  AgendaList,
  BerandaTempArtwork,
  FAQList,
  InformationCard,
  KKMGrid,
  SekretariatGrid,
  SekretariatSidebar,
} from "./special/Placeholders";
import { StrukturOrganisasiGraph } from "./special/StrukturOrganisasiGraph";
import TimelineSeleksi from "./special/TimelineSeleksi";

export const componentRegistry: Record<
  string,
  React.FC<Record<string, unknown>>
> = {
  Title: GenericTitle,
  "Beranda Title": GenericTitle,
  "Line Title": GenericLineTitle,
  Description: GenericDescription,
  Copy: GenericCopy,
  Button: GenericButton,
  "Button Span": GenericButtonSpan,
  "Aduan Form": AduanForm,
  "Struktur Organisasi Graph": StrukturOrganisasiGraph,
  "Karya Grid": KaryaGrid,
  "Timeline Seleksi": TimelineSeleksi,
  "FAQ List": FAQList,
  "Agenda List": AgendaList,
  "Sekretariat Grid": SekretariatGrid,
  "Sekretariat Sidebar": SekretariatSidebar,
  "Panduan Divisi": PanduanDivisi,
  Checklists: PendaftaranChecklists,
  "KKM Grid": KKMGrid,
  "Information Card": InformationCard,
  "Beranda Temp Artwork": BerandaTempArtwork,
};
