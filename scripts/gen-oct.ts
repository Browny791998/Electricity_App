// Generates data/yangon-2026-10.json (days 4-31) and validates it with the
// same Zod schema + business rules the admin upload page uses.
//   npm run gen:oct
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { WEEKDAYS_MM, weekdayIndex } from "../lib/calendar";
import { buildRows, parseScheduleFile, validateBusiness } from "../lib/validate";

const REGION = "yangon";
const MONTH = "2026-10";
const FIRST_DAY = 4;
const LAST_DAY = 31;
const OUT = "data/yangon-2026-10.json";

const EVEN = ["A", "B", "A", "B", "A+B"];
const ODD = ["B", "A", "B", "A", "B+A"];

const days: Record<string, string[]> = {};
for (let d = FIRST_DAY; d <= LAST_DAY; d++) {
  days[String(d)] = d % 2 === 0 ? EVEN : ODD;
}

const text = JSON.stringify({ region: REGION, month: MONTH, days }, null, 2) + "\n";
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, text);
console.log(`Wrote ${OUT}\n`);

// Validate exactly as the upload page does.
const parsed = parseScheduleFile(text);
if (!parsed.ok) {
  console.error("Schema validation FAILED:");
  parsed.errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}
const check = validateBusiness(parsed.data, [REGION]);
check.errors.forEach((e) => console.error("ERROR  :", e));
check.warnings.forEach((w) => console.log("WARNING:", w, "(expected: source has no days 1-3)"));
if (check.errors.length > 0) process.exit(1);

const table = Array.from({ length: LAST_DAY - FIRST_DAY + 1 }, (_, i) => {
  const d = FIRST_DAY + i;
  const [s1, s2, s3, s4, s5] = parsed.data.days[String(d)];
  return {
    day: d,
    weekday: WEEKDAYS_MM[weekdayIndex(`${MONTH}-${String(d).padStart(2, "0")}`)],
    "1 (05-09)": s1,
    "2 (09-13)": s2,
    "3 (13-17)": s3,
    "4 (17-21)": s4,
    "5 (21-05)": s5,
  };
});
console.log();
console.table(table);
console.log(
  `\nSchema OK · ${table.length} days · ${buildRows(parsed.data).length} rows · missing days: ${check.missingDays.join(", ")}`,
);
