import { describe, it, expect } from "vitest";
import {
  rowsToThread,
  appendMessage,
  settleProposal,
  type AiMessageRow,
  type ChatMessage,
} from "./chat-thread";

const row = (over: Partial<AiMessageRow>): AiMessageRow => ({
  id: "r1",
  role: "user",
  kind: "text",
  payload: {},
  created_at: "2026-06-05T10:00:00Z",
  ...over,
});

describe("rowsToThread", () => {
  it("mappe un message utilisateur avec ses chips", () => {
    const t = rowsToThread([
      row({
        id: "u1",
        role: "user",
        kind: "text",
        payload: { message: "Boutons dorés", targetLabel: "bouton « Réserver »", effectName: "Halo" },
      }),
    ]);
    expect(t).toEqual([
      { id: "u1", role: "user", text: "Boutons dorés", targetLabel: "bouton « Réserver »", effectName: "Halo" },
    ]);
  });

  it("proposition suivie d'un commit → accepted, le commit est consommé", () => {
    const t = rowsToThread([
      row({ id: "p1", role: "assistant", kind: "proposal", payload: { action: "css", explanation: "Doré." } }),
      row({ id: "c1", role: "assistant", kind: "commit", payload: { action: "css" } }),
    ]);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ id: "p1", kind: "proposal", action: "css", status: "accepted" });
  });

  it("proposition sans commit → expired (l'aperçu live n'existe plus après reload)", () => {
    const t = rowsToThread([
      row({ id: "p1", role: "assistant", kind: "proposal", payload: { action: "component", explanation: "Intégré." } }),
    ]);
    expect(t[0]).toMatchObject({ status: "expired", action: "component" });
  });

  it("un commit règle la proposition non réglée la plus récente", () => {
    const t = rowsToThread([
      row({ id: "p1", role: "assistant", kind: "proposal", payload: { action: "css", explanation: "A" } }),
      row({ id: "p2", role: "assistant", kind: "proposal", payload: { action: "css", explanation: "B" } }),
      row({ id: "c1", role: "assistant", kind: "commit", payload: { action: "css" } }),
    ]);
    expect(t).toHaveLength(2);
    expect(t[0]).toMatchObject({ id: "p1", status: "expired" });
    expect(t[1]).toMatchObject({ id: "p2", status: "accepted" });
  });

  it("payload.error → message d'erreur assistant", () => {
    const t = rowsToThread([
      row({ id: "e1", role: "assistant", kind: "text", payload: { error: "Demande trop large." } }),
    ]);
    expect(t[0]).toEqual({
      id: "e1",
      role: "assistant",
      kind: "text",
      text: "Demande trop large.",
      isError: true,
    });
  });
});

describe("appendMessage", () => {
  const active: ChatMessage = {
    id: "p1",
    role: "assistant",
    kind: "proposal",
    action: "css",
    explanation: "A",
    status: "active",
  };

  it("expire la proposition active quand une nouvelle proposition arrive", () => {
    const next = appendMessage([active], {
      id: "p2",
      role: "assistant",
      kind: "proposal",
      action: "css",
      explanation: "B",
      status: "active",
    });
    expect(next[0]).toMatchObject({ id: "p1", status: "expired" });
    expect(next[1]).toMatchObject({ id: "p2", status: "active" });
  });

  it("n'altère pas le fil pour un message simple", () => {
    const next = appendMessage([active], { id: "u1", role: "user", text: "ok" });
    expect(next[0]).toMatchObject({ id: "p1", status: "active" });
    expect(next).toHaveLength(2);
  });
});

describe("settleProposal", () => {
  it("règle la proposition visée par id", () => {
    const thread: ChatMessage[] = [
      { id: "p1", role: "assistant", kind: "proposal", action: "css", explanation: "A", status: "active" },
    ];
    expect(settleProposal(thread, "p1", "accepted")[0]).toMatchObject({ status: "accepted" });
    expect(settleProposal(thread, "p1", "expired")[0]).toMatchObject({ status: "expired" });
    expect(settleProposal(thread, "autre", "accepted")[0]).toMatchObject({ status: "active" });
  });
});
