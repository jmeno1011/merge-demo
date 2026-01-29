import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App";

vi.mock("@ffmpeg/ffmpeg", () => {
  class FFmpeg {
    private callbacks = new Map<string, (data: any) => void>();
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
  return { FFmpeg };
});

vi.mock("@ffmpeg/util", () => {
  return {
    fetchFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
    toBlobURL: vi.fn(async (url: string) => url),
  };
});

const makeFile = (name: string, type: string) =>
  new File(["data"], name, { type });

describe("App", () => {
  it("renders base UI", async () => {
    render(<App />);
    await screen.findByText("✅ FFmpeg ready");
    expect(screen.getByText("Merge Studio")).toBeInTheDocument();
    expect(
      screen.getByText("File order (merged from top to bottom)"),
    ).toBeInTheDocument();
  });

  it("merges two audio files and shows output preview", async () => {
    const { container } = render(<App />);
    await screen.findByText("✅ FFmpeg ready");
    const input = container.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();

    const files = [
      makeFile("a.mp3", "audio/mpeg"),
      makeFile("b.mp3", "audio/mpeg"),
    ];
    fireEvent.change(input, { target: { files } });

    const mergeButton = screen.getByRole("button", { name: "Merge" });
    fireEvent.click(mergeButton);

    await waitFor(() =>
      expect(screen.getByText("Preview")).toBeInTheDocument(),
    );
    expect(screen.getByText(/Download:/)).toBeInTheDocument();
  });

  it("blocks invalid trim settings", async () => {
    const { container } = render(<App />);
    await screen.findByText("✅ FFmpeg ready");
    const input = container.querySelector(
      'input[type="file"][multiple]',
    ) as HTMLInputElement;
    const files = [
      makeFile("a.mp3", "audio/mpeg"),
      makeFile("b.mp3", "audio/mpeg"),
    ];
    fireEvent.change(input, { target: { files } });

    const startInput = screen.getAllByLabelText("Start (s)")[0];
    const endInput = screen.getAllByLabelText("End (s)")[0];
    fireEvent.change(startInput, { target: { value: "10" } });
    fireEvent.change(endInput, { target: { value: "5" } });

    const mergeButton = screen.getByRole("button", { name: "Merge" });
    fireEvent.click(mergeButton);

    await waitFor(() =>
      expect(
        screen.getByText("Error: End time must be greater than start time."),
      ).toBeInTheDocument(),
    );
  });
});
