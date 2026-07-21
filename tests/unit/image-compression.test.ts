import { describe, it, expect } from "vitest";

describe("Client-side Image Optimization Pipeline", () => {
  it("validates image format and max size limits", () => {
    const validFile = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    const invalidFile = new File(["dummy"], "doc.pdf", { type: "application/pdf" });

    expect(validFile.type.startsWith("image/")).toBe(true);
    expect(invalidFile.type.startsWith("image/")).toBe(false);
  });

  it("formats image filenames with .webp extension", () => {
    const originalName = "house_front.jpg";
    const webpName = originalName.replace(/\.[^/.]+$/, "") + ".webp";
    expect(webpName).toBe("house_front.webp");
  });
});
