"use client";

import { useEffect } from "react";
import { seedGugaData } from "@/lib/storage";

export default function DataInitializer() {
  useEffect(() => {
    seedGugaData();
  }, []);
  return null;
}
