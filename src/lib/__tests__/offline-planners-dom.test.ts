/* global Element, Document, HTMLAnchorElement, HTMLSelectElement, HTMLTextAreaElement, HTMLFormElement */
import { readFileSync } from "node:fs";
import { Blob as NodeBlob } from "node:buffer";
import { runInNewContext } from "node:vm";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const HOME_KEY = "little-mint.workspace.v1";
const OWNER_KEY = "blokpakt.owner-workspace.v1";
const homeHTML = readFileSync(resolve("public/home-planner.html"), "utf8");
const ownerHTML = readFileSync(resolve("owner-workspace.html"), "utf8");
const recoveryHTML = readFileSync(resolve("offline-workspace.html"), "utf8");
const cleanups: Array<() => void> = [];

function element<T extends Element = HTMLElement>(
  doc: Document,
  selector: string,
): T {
  const result = doc.querySelector<T>(selector);
  if (!result) throw new Error(`Missing element: ${selector}`);
  return result;
}

function localDay(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function openNotebook(html: string, protocol = "file:") {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc)
    throw new Error("Could not create isolated notebook document");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error("Expected a single inline script");
  doc.open();
  doc.write(html.replace(/<script>[\s\S]*?<\/script>/, ""));
  doc.close();
  win.scrollTo = vi.fn();
  doc.querySelectorAll("form").forEach((form) => {
    form.scrollIntoView = vi.fn();
  });
  doc.querySelectorAll("dialog").forEach((dialog) => {
    dialog.showModal = () => {
      dialog.open = true;
    };
    dialog.close = () => {
      dialog.open = false;
    };
  });
  const downloads: Array<{ name: string; blob: NodeBlob }> = [];
  const blobs: NodeBlob[] = [];
  const urls = {
    createObjectURL: vi.fn((blob: NodeBlob) => {
      blobs.push(blob);
      return `blob:notebook-test-${blobs.length}`;
    }),
    revokeObjectURL: vi.fn(),
  };
  Object.defineProperty(
    Object.getPrototypeOf(doc.createElement("a")),
    "click",
    {
      configurable: true,
      value(this: HTMLAnchorElement) {
        const blob = blobs.at(-1);
        if (!blob) throw new Error("Download had no blob");
        downloads.push({ name: this.download, blob });
      },
    },
  );
  const confirm = vi.fn(() => true);
  const timeouts: number[] = [];
  const intervals: number[] = [];
  runInNewContext(script, {
    window: win,
    document: doc,
    location: { protocol, reload: vi.fn() },
    localStorage: window.localStorage,
    Date,
    Intl,
    FormData: window.FormData,
    crypto: window.crypto,
    Blob: NodeBlob,
    URL: urls,
    confirm,
    setTimeout: (callback: () => void, delay: number) => {
      const timer = window.setTimeout(callback, delay);
      timeouts.push(timer);
      return timer;
    },
    clearTimeout: window.clearTimeout.bind(window),
    setInterval: (callback: () => void, delay: number) => {
      const timer = window.setInterval(callback, delay);
      intervals.push(timer);
      return timer;
    },
  });
  const close = () => {
    timeouts.forEach((timer) => window.clearTimeout(timer));
    intervals.forEach((timer) => window.clearInterval(timer));
    win.close();
    frame.remove();
  };
  cleanups.push(close);
  return {
    doc,
    win,
    confirm,
    downloads,
    close,
    urls,
    click: (selector: string) =>
      element<HTMLButtonElement>(doc, selector).click(),
    fill: (selector: string, value: string) => {
      const field = element<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >(doc, selector);
      field.value = value;
      field.dispatchEvent(new window.Event("input", { bubbles: true }));
      field.dispatchEvent(new window.Event("change", { bubbles: true }));
    },
    submit: (selector: string) => {
      element<HTMLFormElement>(doc, selector).dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    },
    importFile: async (text: string, size = text.length) => {
      const input = element<HTMLInputElement>(doc, "#import-file");
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [{ size, text: async () => text }],
      });
      input.dispatchEvent(new window.Event("change", { bubbles: true }));
      await new Promise<void>((done) => window.setTimeout(done, 0));
    },
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanups.splice(0).forEach((close) => close());
  vi.restoreAllMocks();
});

describe("Blokpakt home planner interactions", () => {
  it("starts with dated examples, four recent rows, inline illustrations, and no offline download link", () => {
    const app = openNotebook(homeHTML);
    expect(app.doc.title).toBe("Blokpakt | Home & time planner");
    expect(element(app.doc, "#example-notice").hidden).toBe(false);
    expect(app.doc.querySelectorAll(".ledger-row")).toHaveLength(4);
    expect(app.doc.querySelector("svg.pig")).not.toBeNull();
    expect(app.doc.querySelector("svg.chart polyline")).not.toBeNull();
    expect(element(app.doc, "#download-planner").hidden).toBe(true);
    expect(
      element<HTMLAnchorElement>(app.doc, ".neighborhood-note a").href,
    ).toBe("https://blokpakt.com/our-story");
    expect(element(app.doc, ".neighborhood-note").textContent).toContain(
      "Your planner figures are not attached",
    );
    const stored = JSON.parse(localStorage.getItem(HOME_KEY)!);
    expect(
      stored.entries.every(
        (entry: { date: string; example: boolean }) =>
          entry.example && entry.date.startsWith(localDay().slice(0, 7)),
      ),
    ).toBe(true);
  });

  it("offers an explicit fresh HTML download when hosted online", () => {
    const app = openNotebook(homeHTML, "https:");
    const link = element<HTMLAnchorElement>(app.doc, "#download-planner");
    expect(link.hidden).toBe(false);
    expect(link.getAttribute("href")).toBe("home-planner.html");
    expect(link.download).toBe("blokpakt-home-planner.html");
  });

  it("saves an expense immediately as work time, escapes notes, and keeps it after reload and cleanup", () => {
    const app = openNotebook(homeHTML);
    const note = "<img src=x onerror=alert(1)>";
    app.fill('#ledger-form [name="amount"]', "18");
    app.fill('#ledger-form [name="note"]', note);
    app.submit("#ledger-form");
    expect(element(app.doc, "#entry-feedback").textContent).toContain(
      "Saved $18.00 expense = 1h 0m of work",
    );
    expect(app.doc.querySelectorAll(".ledger-row")).toHaveLength(4);
    expect(element(app.doc, ".entry-name").textContent).toBe(note);
    expect(app.doc.querySelector(".ledger-row img")).toBeNull();
    app.click('[data-action="cleanup"]');
    const stored = JSON.parse(localStorage.getItem(HOME_KEY)!);
    expect(stored.entries).toHaveLength(1);
    expect(stored.entries[0]).toMatchObject({
      amount: 18,
      note,
      example: false,
    });
    expect(stored.profile.salary).toBe(0);
    expect(element(app.doc, "#example-notice").hidden).toBe(true);
    app.close();
    const reopened = openNotebook(homeHTML);
    expect(reopened.doc.querySelectorAll(".ledger-row")).toHaveLength(1);
    expect(element(reopened.doc, ".entry-name").textContent).toBe(note);
  });

  it("recalculates hourly pay live but persists only on save and preserves custom settings during cleanup", () => {
    const app = openNotebook(homeHTML);
    app.click('[data-tab="wage"]');
    app.fill('#profile-form [name="salary"]', "4000");
    expect(element(app.doc, "#wage-result").textContent).toContain("$20.06");
    expect(JSON.parse(localStorage.getItem(HOME_KEY)!).profile.salary).toBe(
      3600,
    );
    app.submit("#profile-form");
    app.click('[data-action="cleanup"]');
    expect(JSON.parse(localStorage.getItem(HOME_KEY)!).profile).toMatchObject({
      salary: 4000,
      example: false,
    });
    app.fill('#profile-form [name="salary"]', "");
    expect(element(app.doc, "#wage-result").textContent).toContain(
      "Enter valid values",
    );
    expect(element(app.doc, "#profile-status").textContent).toContain(
      "Saved settings have not changed",
    );
  });

  it("simulates pay, commute, and overtime without changing stored settings and rejects stale invalid output", () => {
    const app = openNotebook(homeHTML);
    const before = localStorage.getItem(HOME_KEY);
    app.click('[data-tab="scenarios"]');
    app.fill('#scenario-form [name="raise"]', "10");
    app.fill('#scenario-form [name="commute"]', "0");
    app.fill('#scenario-form [name="overtime"]', "0");
    expect(element(app.doc, "#scenario-result").textContent).toContain(
      "$23.47",
    );
    expect(element(app.doc, "#scenario-result").textContent).toContain("+32 h");
    expect(element(app.doc, "#scenario-result").textContent).toContain("+$390");
    expect(localStorage.getItem(HOME_KEY)).toBe(before);
    app.fill('#scenario-form [name="commute"]', "-1");
    expect(element(app.doc, "#scenario-result").textContent).toContain(
      "Enter valid values",
    );
  });

  it("confirms imports, round-trips backups, and rejects invalid backups without replacing data", async () => {
    const app = openNotebook(homeHTML);
    app.click('[data-action="export"]');
    const backup = await app.downloads[0].blob.text();
    expect(JSON.parse(backup)).toEqual(
      JSON.parse(localStorage.getItem(HOME_KEY)!),
    );
    app.click('[data-action="reset"]');
    await app.importFile(backup);
    expect(JSON.parse(localStorage.getItem(HOME_KEY)!).entries).toHaveLength(6);
    const stored = localStorage.getItem(HOME_KEY);
    app.confirm.mockReturnValueOnce(false);
    await app.importFile(backup);
    expect(localStorage.getItem(HOME_KEY)).toBe(stored);
    await app.importFile('{"version":999}');
    expect(localStorage.getItem(HOME_KEY)).toBe(stored);
    expect(element(app.doc, "#toast").textContent).toContain("Restore stopped");
    expect(element(app.doc, "#data-feedback").textContent).toContain(
      "Restore stopped",
    );
    await app.importFile(backup, 9 * 1024 * 1024);
    expect(element(app.doc, "#toast").textContent).toContain("8 MB");
  });

  it("does not replace corrupt stored data with examples and can export the raw recovery copy", async () => {
    localStorage.setItem(HOME_KEY, "{broken");
    const app = openNotebook(homeHTML);
    expect(localStorage.getItem(HOME_KEY)).toBe("{broken");
    expect(app.doc.querySelectorAll(".ledger-row")).toHaveLength(0);
    expect(element(app.doc, "#storage-warning").textContent).toContain(
      "Existing data will not be overwritten",
    );
    app.click('[data-action="export"]');
    expect(await app.downloads[0].blob.text()).toBe("{broken");
    app.fill('#ledger-form [name="amount"]', "20");
    app.submit("#ledger-form");
    expect(localStorage.getItem(HOME_KEY)).toBe("{broken");
    expect(element(app.doc, "#toast").textContent).toContain(
      "Saving is paused",
    );
  });

  it("reports a failed backup inside data settings instead of claiming an export succeeded", () => {
    const app = openNotebook(homeHTML);
    app.click('[data-action="data"]');
    app.urls.createObjectURL.mockImplementation(() => {
      throw new Error("Download unavailable");
    });
    app.click('[data-action="export"]');
    expect(element(app.doc, "#data-feedback").hidden).toBe(false);
    expect(element(app.doc, "#data-feedback").textContent).toBe(
      "Backup could not be downloaded: Download unavailable",
    );
    expect(app.downloads).toHaveLength(0);
  });

  it("surfaces a failed write without showing a saved entry and pauses on another-tab changes", () => {
    const app = openNotebook(homeHTML);
    const before = localStorage.getItem(HOME_KEY);
    const write = vi
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage full");
      });
    app.fill('#ledger-form [name="amount"]', "20");
    app.submit("#ledger-form");
    expect(element(app.doc, "#toast").textContent).toContain("Not saved");
    expect(element(app.doc, "#entry-feedback").hidden).toBe(true);
    expect(localStorage.getItem(HOME_KEY)).toBe(before);
    write.mockRestore();
    app.win.dispatchEvent(
      new window.StorageEvent("storage", { key: HOME_KEY }),
    );
    app.submit("#ledger-form");
    expect(element(app.doc, "#storage-warning").textContent).toContain(
      "another tab",
    );
    expect(localStorage.getItem(HOME_KEY)).toBe(before);
  });
});

describe("local owner notebook", () => {
  it("starts from zero with increasing numbers above each feature, not an invented real user count", () => {
    const app = openNotebook(ownerHTML);
    expect(element(app.doc, "#household-count").textContent).toBe(
      "Not recorded",
    );
    const cards = [...app.doc.querySelectorAll(".milestone")];
    expect(
      cards.map((card) => card.querySelector(".threshold")?.textContent),
    ).toEqual(["0", "10", "50", "100", "500"]);
    expect(
      cards.every((card) =>
        Boolean(
          card
            .querySelector(".threshold")!
            .compareDocumentPosition(card.querySelector("h3")!) &
          window.Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
    ).toBe(true);
    expect(element(app.doc, "#path-view")).toHaveTextContent(
      "Reaching a number never launches a feature",
    );
  });

  it("keeps starter suggestions undated and separates owner and home-planner storage", () => {
    localStorage.setItem(HOME_KEY, "keep home data");
    const app = openNotebook(ownerHTML);
    const stored = JSON.parse(localStorage.getItem(OWNER_KEY)!);
    expect(stored.tasks).toHaveLength(7);
    expect(
      stored.tasks.every(
        (task: { example: boolean; done: boolean; due: string }) =>
          task.example && !task.done && task.due === "",
      ),
    ).toBe(true);
    expect(element(app.doc, "#due-count").textContent).toBe("0");
    app.click('[data-action="reset"]');
    expect(JSON.parse(localStorage.getItem(OWNER_KEY)!).tasks).toHaveLength(0);
    expect(localStorage.getItem(HOME_KEY)).toBe("keep home data");
    app.close();
    expect(openNotebook(ownerHTML).doc.querySelectorAll(".task")).toHaveLength(
      0,
    );
  });

  it("requires a sourced, dated aggregate and never marks reached thresholds as a live launch", () => {
    const app = openNotebook(ownerHTML);
    app.fill('#observation-form [name="households"]', "500");
    app.submit("#observation-form");
    expect(element(app.doc, "#feedback").textContent).toContain("Not saved");
    expect(element(app.doc, "#household-count").textContent).toBe(
      "Not recorded",
    );
    app.fill('#observation-form [name="asOf"]', localDay());
    app.fill('#observation-form [name="source"]', "Anonymized pilot review");
    app.submit("#observation-form");
    expect(element(app.doc, "#household-count").textContent).toBe("500");
    expect(element(app.doc, "#household-caption").textContent).toContain(
      "Owner-entered, not verified by this app",
    );
    expect(
      [...app.doc.querySelectorAll(".milestone .tag")].every(
        (tag) => tag.textContent === "Count reached · evidence still needed",
      ),
    ).toBe(true);
    expect(element(app.doc, "#feedback").textContent).toContain(
      "No feature was launched",
    );
  });

  it("edits milestone drafts while enforcing strictly increasing thresholds and a fixed zero", () => {
    const app = openNotebook(ownerHTML);
    app.click('[data-edit-milestone="learn"]');
    app.fill('#milestone-form [name="threshold"]', "50");
    app.submit("#milestone-form");
    expect(element(app.doc, "#milestone-error").textContent).toContain(
      "increase in order",
    );
    expect(
      JSON.parse(localStorage.getItem(OWNER_KEY)!).milestones[1].threshold,
    ).toBe(10);
    app.fill('#milestone-form [name="threshold"]', "20");
    app.fill('#milestone-form [name="title"]', "Learn with twenty households");
    app.submit("#milestone-form");
    expect(element(app.doc, '[data-milestone="learn"] h3').textContent).toBe(
      "Learn with twenty households",
    );
    expect(
      element(app.doc, '[data-milestone="learn"] .threshold').textContent,
    ).toBe("20");
    app.click('[data-edit-milestone="start"]');
    expect(
      element<HTMLInputElement>(app.doc, '#milestone-form [name="threshold"]')
        .readOnly,
    ).toBe(true);
  });

  it("adds and edits due tasks, persists reminders, and escapes imported or entered text", () => {
    const app = openNotebook(ownerHTML);
    app.click('[data-view="tasks"]');
    app.fill('#task-form [name="title"]', "Ask about service scope");
    app.fill('#task-form [name="note"]', "<img src=x onerror=alert(1)>");
    app.fill('#task-form [name="due"]', localDay(-1));
    app.submit("#task-form");
    expect(element(app.doc, "#due-count").textContent).toBe("1");
    expect(element(app.doc, "#reminders").textContent).toContain("Overdue");
    expect(app.doc.querySelector("#tasks img")).toBeNull();
    const task = JSON.parse(localStorage.getItem(OWNER_KEY)!).tasks.find(
      (item: { example: boolean }) => !item.example,
    );
    app.click(`[data-edit-task="${task.id}"]`);
    app.fill('#task-form [name="due"]', localDay(7));
    app.submit("#task-form");
    expect(element(app.doc, "#due-count").textContent).toBe("0");
    expect(element(app.doc, "#reminders").textContent).toContain(localDay(7));
    app.close();
    const reopened = openNotebook(ownerHTML);
    expect(element(reopened.doc, "#reminders").textContent).toContain(
      "Ask about service scope",
    );
  });

  it("keeps adopted suggestions and personal tasks when removing untouched starters", () => {
    const app = openNotebook(ownerHTML);
    app.click('[data-view="tasks"]');
    app.click('[data-toggle-task="starter-0"]');
    app.click('[data-edit-task="starter-1"]');
    app.fill('#task-form [name="note"]', "My saved follow-up note");
    app.submit("#task-form");
    app.fill('#task-form [name="title"]', "My own task");
    app.submit("#task-form");
    app.click('[data-action="cleanup"]');
    const tasks = JSON.parse(localStorage.getItem(OWNER_KEY)!).tasks;
    expect(tasks).toHaveLength(3);
    expect(tasks.every((task: { example: boolean }) => !task.example)).toBe(
      true,
    );
    expect(
      tasks.find((task: { id: string }) => task.id === "starter-0").done,
    ).toBe(true);
    expect(
      tasks.find((task: { id: string }) => task.id === "starter-1").note,
    ).toBe("My saved follow-up note");
    app.fill("#task-filter", "done");
    expect(app.doc.querySelectorAll(".task")).toHaveLength(1);
    app.confirm.mockReturnValueOnce(false);
    app.click('[data-delete-task="starter-0"]');
    expect(JSON.parse(localStorage.getItem(OWNER_KEY)!).tasks).toHaveLength(3);
    app.click('[data-delete-task="starter-0"]');
    expect(JSON.parse(localStorage.getItem(OWNER_KEY)!).tasks).toHaveLength(2);
  });

  it("round-trips owner backups and rejects foreign, oversized, duplicated, and corrupt imports atomically", async () => {
    const app = openNotebook(ownerHTML);
    app.click('[data-action="export"]');
    const backup = await app.downloads[0].blob.text();
    app.click('[data-action="reset"]');
    await app.importFile(backup);
    expect(JSON.parse(localStorage.getItem(OWNER_KEY)!).tasks).toHaveLength(7);
    const original = localStorage.getItem(OWNER_KEY);
    const invalid = JSON.parse(backup);
    invalid.tasks.push(invalid.tasks[0]);
    for (const text of [
      JSON.stringify(invalid),
      '{"version":1,"profile":{}}',
      "{bad json",
    ]) {
      await app.importFile(text);
      expect(localStorage.getItem(OWNER_KEY)).toBe(original);
      expect(element(app.doc, "#feedback").textContent).toContain(
        "Restore stopped",
      );
    }
    await app.importFile(backup, 5 * 1024 * 1024);
    expect(element(app.doc, "#feedback").textContent).toContain("4 MB");
    expect(localStorage.getItem(OWNER_KEY)).toBe(original);
  });

  it("preserves corrupt owner data, exports recovery, and never substitutes starter suggestions", async () => {
    localStorage.setItem(OWNER_KEY, "damaged owner data");
    const app = openNotebook(ownerHTML);
    expect(app.doc.querySelectorAll(".task")).toHaveLength(0);
    expect(element(app.doc, "#storage-warning").textContent).toContain(
      "Nothing has been replaced",
    );
    app.click('[data-action="export"]');
    expect(await app.downloads[0].blob.text()).toBe("damaged owner data");
    app.fill('#task-form [name="title"]', "Cannot overwrite corruption");
    app.submit("#task-form");
    expect(localStorage.getItem(OWNER_KEY)).toBe("damaged owner data");
    expect(element(app.doc, "#feedback").textContent).toContain(
      "Saving is paused",
    );
  });

  it("retains unsaved form input after a quota failure and detects another-tab writes before saving", () => {
    const app = openNotebook(ownerHTML);
    const original = localStorage.getItem(OWNER_KEY);
    const write = vi
      .spyOn(window.Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
    app.fill('#task-form [name="title"]', "Keep this unsaved text");
    app.submit("#task-form");
    expect(element(app.doc, "#feedback").textContent).toContain("Not saved");
    expect(
      element<HTMLInputElement>(app.doc, '#task-form [name="title"]').value,
    ).toBe("Keep this unsaved text");
    expect(localStorage.getItem(OWNER_KEY)).toBe(original);
    write.mockRestore();
    localStorage.setItem(OWNER_KEY, "another tab changed this");
    app.submit("#task-form");
    expect(element(app.doc, "#storage-warning").textContent).toContain(
      "another tab",
    );
    expect(localStorage.getItem(OWNER_KEY)).toBe("another tab changed this");
  });
});

describe("standalone delivery and old-file recovery", () => {
  it.each([
    {
      name: "home planner",
      html: homeHTML,
      dialog: "#data-dialog",
      open: '[data-action="data"]',
    },
    {
      name: "owner notebook",
      html: ownerHTML,
      dialog: "#archive-dialog",
      open: '[data-action="archive"]',
    },
  ])(
    "uses plain-language backup controls and errors in the $name",
    async ({ html, dialog, open }) => {
      const app = openNotebook(html);
      app.click(open);
      expect(
        element(app.doc, `${dialog} [data-action="export"]`),
      ).toHaveTextContent(/^Download backup$/);
      expect(
        element(app.doc, `${dialog} [data-action="import"]`),
      ).toHaveTextContent(/^Restore backup$/);
      expect(element(app.doc, dialog)).toHaveTextContent(
        "You do not need to open or edit the file",
      );
      expect(element(app.doc, dialog)).toHaveTextContent("Restoring replaces");
      expect(element(app.doc, dialog)).toHaveTextContent("not encrypted");
      expect(app.doc.body).not.toHaveTextContent(/\b(?:JSON|export|import)\b/i);
      await app.importFile("{broken");
      expect(element(app.doc, dialog)).toHaveTextContent(
        "This file could not be read. Choose an unedited backup",
      );
      expect(app.doc.body).not.toHaveTextContent(/\bJSON\b/i);
      app.click('[data-action="export"]');
      expect(app.downloads[0].name).toMatch(/^blokpakt-.*\.json$/);
      expect(JSON.parse(await app.downloads[0].blob.text()).version).toBe(1);
    },
  );

  it.each([homeHTML, ownerHTML, recoveryHTML])(
    "has one inline script and no automatic external resources",
    (html) => {
      expect(html.match(/<script>/g)).toHaveLength(1);
      expect(html).not.toMatch(
        /<(?:script|img|iframe)[^>]+src=|<link[^>]+href=|@import|https?:\/\/[^"'\s]*\.(?:js|css|woff)/i,
      );
      expect(html).toContain("connect-src 'none'");
      expect(html).not.toMatch(/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
    },
  );

  it("exports original file-local records verbatim without altering any storage key", async () => {
    localStorage.setItem(HOME_KEY, '{"old":"raw backup"}');
    localStorage.setItem(OWNER_KEY, "unrelated owner data");
    const app = openNotebook(recoveryHTML);
    expect(element(app.doc, "#export")).toHaveTextContent(
      "Download previous backup",
    );
    expect(app.doc.body).not.toHaveTextContent(/\b(?:JSON|export|import)\b/i);
    app.click("#export");
    expect(await app.downloads[0].blob.text()).toBe('{"old":"raw backup"}');
    expect(localStorage.getItem(HOME_KEY)).toBe('{"old":"raw backup"}');
    expect(localStorage.getItem(OWNER_KEY)).toBe("unrelated owner data");
  });
});
