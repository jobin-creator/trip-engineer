"use client";

import dynamic from "next/dynamic";

const TripEngineer = dynamic(() => import("./TripEngineer"), { ssr: false });

export default function Page() {
  return <TripEngineer />;
}
