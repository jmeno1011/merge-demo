import * as matchers from "@testing-library/jest-dom/matchers";
import { expect, vi } from "vitest";
import "@testing-library/jest-dom";

expect.extend(matchers);

globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
globalThis.URL.revokeObjectURL = vi.fn();
window.alert = vi.fn();
