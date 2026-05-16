import { describe, expect, test } from "bun:test";

describe("overlay browser assets", () => {
  test("loads overlay JavaScript as a classic script for file-based OBS browser sources", async () => {
    const html = await Bun.file("index.html").text();
    const script = await Bun.file("public/overlay.js").text();

    expect(html).toContain('<script defer src="./public/overlay.js"></script>');
    expect(html).not.toContain('type="module"');
    expect(script).not.toContain("export ");
  });

  test("does not render the overlay HUD", async () => {
    const html = await Bun.file("index.html").text();

    expect(html).not.toContain('class="hud"');
    expect(html).not.toContain('id="player-count"');
    expect(html).not.toContain('id="total-items"');
  });
});
