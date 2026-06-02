"use client";

import { useRouter } from "next/navigation";
import { setIntake } from "@/lib/intake-store";
import { AuraHero } from "@/components/ui/aura-hero";

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

  return <AuraHero onPromptSubmit={handlePromptSubmit} />;
}
