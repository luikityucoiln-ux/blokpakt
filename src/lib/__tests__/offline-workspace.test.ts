// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";

const html = readFileSync(
  new URL("../../../public/home-planner.html", import.meta.url),
  "utf8",
);
const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];
const definitions = script.slice(0, script.indexOf("let state,"));
const calculation = script.slice(
  script.indexOf("function wage("),
  script.indexOf("function monthly("),
);
const time = script.slice(
  script.indexOf("function workTime("),
  script.indexOf("function exampleTag("),
);
const planner = runInNewContext(
  `${definitions}\n${calculation}\n${time}\n({demoState, validateData, validDate, wage, workTime})`,
  { Date, Intl },
);

describe("standalone offline workspace", () => {
  it("includes annual bonuses, work costs, commuting and overtime in hourly pay", () => {
    const pay = planner.wage(planner.demoState().profile);
    expect(pay.annualIncome).toBe(46800);
    expect(pay.annualCosts).toBe(1920);
    expect(pay.monthlyHours).toBe(208);
    expect(pay.monthlyNet).toBe(3740);
    expect(pay.hourly).toBeCloseTo(44880 / 2496, 10);
  });

  it("handles zero hours and nonpositive hourly pay without dividing by zero", () => {
    expect(
      planner.wage({ ...planner.demoState().profile, days: 0, overtime: 0 })
        .hourly,
    ).toBeNull();
    expect(planner.workTime(10, 0)).toBe("Set positive hourly pay");
    expect(planner.workTime(10, -5)).toBe("Set positive hourly pay");
    expect(planner.workTime(30, 20)).toBe("1h 30m");
  });

  it("generates explicitly marked examples relative to the current local month", () => {
    const data = planner.demoState();
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    expect(data.profile.example).toBe(true);
    expect(data.goals.example).toBe(true);
    expect(data.entries).toHaveLength(6);
    expect(
      data.entries.every(
        (entry: { example: boolean; date: string }) =>
          entry.example && entry.date.startsWith(month),
      ),
    ).toBe(true);
    expect(planner.validateData(JSON.parse(JSON.stringify(data)))).toEqual(
      data,
    );
  });

  it("rejects damaged backups, duplicate IDs, invalid dates and unsafe amounts", () => {
    const data = planner.demoState();
    expect(() => planner.validateData({ version: 2 })).toThrow();
    expect(() =>
      planner.validateData({
        ...data,
        entries: [data.entries[0], data.entries[0]],
      }),
    ).toThrow();
    for (const amount of [-1, 0, Infinity, 0.001, 1000000001]) {
      expect(() =>
        planner.validateData({
          ...data,
          entries: [{ ...data.entries[0], amount }],
        }),
      ).toThrow();
    }
    expect(planner.validDate("2026-02-30")).toBe(false);
    expect(planner.validDate("2028-02-29")).toBe(true);
    expect(() =>
      planner.validateData({
        ...data,
        profile: { ...data.profile, currency: "INVALID" },
      }),
    ).toThrow();
    expect(() =>
      planner.validateData({
        ...data,
        entries: [{ ...data.entries[0], type: "__proto__" }],
      }),
    ).toThrow();
  });

  it("keeps all runtime resources inline and explicitly disables networking", () => {
    expect(html).not.toMatch(
      /<script[^>]+src=|<link[^>]+href=|<(?:img|iframe)[^>]+src=/i,
    );
    expect(html).toContain("connect-src 'none'");
    expect(script).not.toMatch(/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
  });

  it("includes the safety-buffer shortfall before estimating time to the free-fund goal", () => {
    const data = planner.demoState();
    data.goals.saved = 1000;
    const budgetFunctions = script.slice(
      script.indexOf("function wage("),
      script.indexOf("function workTime("),
    );
    const result = runInNewContext(
      `${definitions}\nlet state = validateData(data), selectedMonth = currentMonth;\n${budgetFunctions}\n({totals: monthly(), goal: goalsMath()})`,
      { Date, Intl, data },
    );
    expect(result.totals.income).toBe(3900);
    expect(result.totals.fixed).toBe(1114);
    expect(result.totals.flexible).toBe(100.5);
    expect(result.totals.surplus).toBe(2525.5);
    expect(result.goal.reserve).toBe(5772);
    expect(result.goal.free).toBe(0);
    expect(result.goal.remaining).toBe(16772);
    expect(result.goal.months).toBe(7);
  });
});
