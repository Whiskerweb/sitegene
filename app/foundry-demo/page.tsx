// app/foundry-demo/page.tsx
import Assembler from "@/components/foundry/Assembler";
import { demoRecipe } from "./demo-recipe";

export const dynamic = "force-static";

export default function FoundryDemoPage() {
  return <Assembler recipe={demoRecipe} />;
}
