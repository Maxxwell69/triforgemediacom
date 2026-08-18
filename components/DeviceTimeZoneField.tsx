"use client";

import { useEffect, useState } from "react";

/** Hidden field so server actions know the submitter’s device timezone. */
export default function DeviceTimeZoneField({ name = "timeZone" }: { name?: string }) {
  const [tz, setTz] = useState("");

  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
  }, []);

  return <input type="hidden" name={name} value={tz} />;
}
