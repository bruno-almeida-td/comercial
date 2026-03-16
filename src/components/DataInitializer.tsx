"use client";

import { useEffect } from "react";
import { seedGugaData, seedSompoParticipants } from "@/lib/storage";

export default function DataInitializer() {
  useEffect(() => {
    seedGugaData();
    seedSompoParticipants();
  }, []);
  return null;
}
