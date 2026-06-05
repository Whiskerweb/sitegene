import { describe, it, expect } from "vitest";
import { pickEditable, pickPublished, distinctTemplates, type ContentRow } from "./site-content-store";

const row = (p: Partial<ContentRow>): ContentRow => ({
  id: p.id ?? "r",
  site_id: "s1",
  template_id: p.template_id ?? "alice-r",
  version: p.version ?? 1,
  content_json: p.content_json ?? {},
  is_published: p.is_published ?? false,
});

describe("pickEditable", () => {
  it("retourne la version max de la peau demandée", () => {
    const rows = [
      row({ id: "a", template_id: "alice-r", version: 1 }),
      row({ id: "b", template_id: "alice-r", version: 3 }),
      row({ id: "c", template_id: "potozon", version: 9 }),
    ];
    expect(pickEditable(rows, "alice-r")?.id).toBe("b");
  });
  it("null si la peau n'a aucun snapshot", () => {
    expect(pickEditable([row({ template_id: "potozon" })], "alice-r")).toBeNull();
  });
});

describe("pickPublished", () => {
  it("retourne la version max parmi les publiés", () => {
    const rows = [
      row({ id: "a", version: 2, is_published: true }),
      row({ id: "b", version: 5, is_published: true }),
      row({ id: "c", version: 9, is_published: false }),
    ];
    expect(pickPublished(rows)?.id).toBe("b");
  });
  it("null si rien n'est publié", () => {
    expect(pickPublished([row({ is_published: false })])).toBeNull();
  });
});

describe("distinctTemplates", () => {
  it("liste les peaux uniques, ignore null", () => {
    const rows = [
      row({ template_id: "alice-r" }),
      row({ template_id: "alice-r" }),
      row({ template_id: "potozon" }),
      row({ template_id: null }),
    ];
    expect(distinctTemplates(rows).sort()).toEqual(["alice-r", "potozon"]);
  });
});
