import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __FFMPEG_MOCK__?: any;
    __FFMPEG_FETCH_FILE__?: any;
    __FFMPEG_TO_BLOB_URL__?: any;
  }
}

test.describe("Merge Studio", () => {
  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.addInitScript(() => {
      class FFmpegMock {
        callbacks: Map<string, (data: any) => void> = new Map();
        on(event: string, cb: (data: any) => void) {
          this.callbacks.set(event, cb);
        }
        async load() {
          return true;
        }
        async writeFile() {
          return true;
        }
        async readFile() {
          return new Uint8Array([1, 2, 3]);
        }
        async exec() {
          const progress = this.callbacks.get("progress");
          if (progress) progress({ ratio: 1 });
          return 0;
        }
      }

      window.__FFMPEG_MOCK__ = FFmpegMock;
      window.__FFMPEG_FETCH_FILE__ = async () => new Uint8Array([1, 2, 3]);
      window.__FFMPEG_TO_BLOB_URL__ = async (url: any) => url;
    });
  });

  test("loads and allows selecting files", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Merge Studio" })).toBeVisible();
    await expect(
      page.getByText("File order (merged from top to bottom)"),
    ).toBeVisible();

    const fileInput = page.locator('input[type="file"][multiple]').first();
    await fileInput.setInputFiles([
      {
        name: "first.mp3",
        mimeType: "audio/mpeg",
        buffer: Buffer.from("fake-audio-1"),
      },
      {
        name: "second.mp3",
        mimeType: "audio/mpeg",
        buffer: Buffer.from("fake-audio-2"),
      },
    ]);

    await expect(page.getByText("first.mp3")).toBeVisible();
    await expect(page.getByText("second.mp3")).toBeVisible();
    await expect(page.getByLabel("Start (s)").first()).toBeVisible();
    await expect(page.getByLabel("End (s)").first()).toBeVisible();
  });

  test("reset clears files list", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"][multiple]').first();
    await fileInput.setInputFiles([
      {
        name: "one.mp3",
        mimeType: "audio/mpeg",
        buffer: Buffer.from("fake-audio"),
      },
      {
        name: "two.mp3",
        mimeType: "audio/mpeg",
        buffer: Buffer.from("fake-audio"),
      },
    ]);

    await expect(page.getByText("one.mp3")).toBeVisible();
    await page.getByRole("button", { name: "Reset" }).click();

    await expect(page.getByText("Please choose files.")).toBeVisible();
  });

  test("merge shows output preview for audio", async ({ page }) => {
    await page.goto("/");

    const fileInput = page.locator('input[type="file"][multiple]').first();
    await fileInput.setInputFiles([
      {
        name: "one.mp3",
        mimeType: "audio/mpeg",
        buffer: Buffer.from("fake-audio"),
      },
      {
        name: "two.mp3",
        mimeType: "audio/mpeg",
        buffer: Buffer.from("fake-audio"),
      },
    ]);

    await page.getByRole("button", { name: "Merge" }).click();

    await expect(page.getByText("PREVIEW", { exact: true })).toBeVisible();
    await expect(page.getByText(/Download:/)).toBeVisible();
  });

  test("switches to video mode and shows preview controls", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Type").selectOption("video");
    await expect(page.getByText("Supports MP4, MOV")).toBeVisible();

    const fileInput = page.locator('input[type="file"][multiple]').first();
    await fileInput.setInputFiles([
      {
        name: "clip.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.from("fake-video"),
      },
      {
        name: "clip2.mp4",
        mimeType: "video/mp4",
        buffer: Buffer.from("fake-video"),
      },
    ]);

    await expect(page.getByText("clip.mp4")).toBeVisible();
    await expect(page.locator("video").first()).toBeVisible();
  });

  test("uploads cover art and shows preview", async ({ page }) => {
    await page.goto("/");

    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
    const pngBuffer = Buffer.from(pngBase64, "base64");
    const coverInput = page.locator('input[type="file"][accept="image/*"]');
    await coverInput.setInputFiles([
      {
        name: "cover.png",
        mimeType: "image/png",
        buffer: pngBuffer,
      },
    ]);

    await expect(page.getByAltText("Cover preview")).toBeVisible();
  });
});
