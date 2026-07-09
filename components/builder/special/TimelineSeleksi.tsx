import SelectionTimelineCalendar from "@/components/SelectionTimelineCalendar";
import type { RecruitmentTimelineData } from "@/lib/notion";

interface TimelineSeleksiProps {
  value1?: string;
  value2?: string;
  value3?: string;
  cmsVariables?: Record<string, string>;
  timeline?: RecruitmentTimelineData | null;
}

export default function TimelineSeleksi({
  value1: _value1,
  value2: _value2,
  value3: _value3,
  cmsVariables,
  timeline,
}: TimelineSeleksiProps) {
  const currentYear = cmsVariables?.CURRENT_YEAR;
  const currentBatch = cmsVariables?.CURRENT_BATCH;

  return (
    <div className="w-full">
      <SelectionTimelineCalendar
        currentYear={currentYear}
        currentBatch={currentBatch}
        timelineData={timeline}
      />
    </div>
  );
}
