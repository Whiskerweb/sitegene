// lib/foundry/fields.test.ts
import { describe, it, expect } from "vitest";
import { fieldType, fieldsFor, labelForKey } from "./fields";

describe("fieldType", () => {
  it("classe les scalaires", () => {
    expect(fieldType("title", "Bonjour")).toBe("text");
    expect(fieldType("desc", "x")).toBe("textarea"); // clé longue
    expect(fieldType("body", "court")).toBe("textarea");
    expect(fieldType("value", 12)).toBe("number");
    expect(fieldType("featured", true)).toBe("boolean");
    expect(fieldType("title", "x".repeat(120))).toBe("textarea"); // long → textarea
  });
  it("détecte les images (simples et listes)", () => {
    expect(fieldType("image", "/a.jpg")).toBe("image");
    expect(fieldType("avatar", "/a.jpg")).toBe("image");
    expect(fieldType("logo", "/l.svg")).toBe("image");
    expect(fieldType("avatars", ["/a.jpg", "/b.jpg"])).toBe("imageList");
    expect(fieldType("images", ["/a.jpg"])).toBe("imageList");
  });
  it("détecte les listes", () => {
    expect(fieldType("links", ["Accueil", "Contact"])).toBe("stringList");
    expect(fieldType("items", [{ title: "A", desc: "B" }])).toBe("objectList");
    expect(fieldType("plans", [{ name: "Pro", price: "9€" }])).toBe("objectList");
  });
});

describe("labelForKey", () => {
  it("donne des libellés FR connus et embellit l'inconnu", () => {
    expect(labelForKey("cta")).toBe("Bouton");
    expect(labelForKey("proofLabel")).toBe("Légende du chiffre");
    expect(labelForKey("monChampPerso")).toBe("Mon champ perso");
    expect(labelForKey("two_words")).toBe("Two words");
  });
});

describe("fieldsFor", () => {
  it("génère des champs ordonnés, masque null/undefined, expose les sous-champs", () => {
    const fields = fieldsFor({
      title: "Titre",
      desc: "Une longue description du service proposé.",
      image: "/hero.jpg",
      links: ["Accueil", "Contact"],
      items: [{ title: "A", desc: "B", icon: "x" }],
      vide: null,
    });
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f]));
    expect(byKey.vide).toBeUndefined();
    expect(byKey.title.type).toBe("text");
    expect(byKey.desc.type).toBe("textarea");
    expect(byKey.image.type).toBe("image");
    expect(byKey.links.type).toBe("stringList");
    expect(byKey.items.type).toBe("objectList");
    expect(byKey.items.itemFields?.map((f) => f.key)).toEqual(["title", "desc", "icon"]);
    expect(byKey.items.itemFields?.find((f) => f.key === "desc")?.type).toBe("textarea");
  });
});
