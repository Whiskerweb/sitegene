"use client";

import { useRouter } from "next/navigation";
import { setIntake } from "@/lib/intake-store";
import { HeroWave } from "@/components/ui/ai-input-hero";

export default function ScrollHero() {
  const router = useRouter();

  function handlePromptSubmit(value: string, photos: File[] = []) {
    setIntake({
      categoryId: "photographe",
      brief: value.trim(),
      photos,
      company: "",
    });
    router.push("/create");
  }

  return (
    <HeroWave onPromptSubmit={handlePromptSubmit} />
  );
}
