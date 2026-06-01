import React from "react";

import SelectionTimelineCalendar from "@/components/SelectionTimelineCalendar";

interface TimelineSeleksiProps {
  value1?: string;
  value2?: string;
  value3?: string;
}

export default function TimelineSeleksi({
  value1: _value1,
  value2: _value2,
  value3: _value3,
}: TimelineSeleksiProps) {
  return (
    <div className="w-full">
      <SelectionTimelineCalendar />
    </div>
  );
}
