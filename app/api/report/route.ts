import { createHash, randomUUID } from "node:crypto";
import {
  MAX_FILE_BYTES,
  MAX_PHOTOS,
  MAX_REQUESTS_PER_HOUR,
  MAX_TOTAL_BYTES,
  detectImageType,
  validateReportFields,
} from "@/lib/report";
import { sendReportEmail } from "@/lib/send-report-email";
import { createServiceClient } from "@/lib/supabase-service";

const BUCKET = "report-photos";
const fail = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

function ipHash(request: Request): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  return createHash("sha256")
    .update(`${process.env.REPORT_IP_SALT ?? "electricity-app"}:${ip}`)
    .digest("hex");
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return fail("အခု ပို့လို့ မရသေးပါ။ နောက်မှ ပြန်ကြိုးစားပါ", 503);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_TOTAL_BYTES + 100_000) {
    return fail("ဓာတ်ပုံ ဖိုင်အရွယ်အစား ကြီးလွန်းသည်", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("ပို့လို့ မရပါ။ ပြန်ကြိုးစားပါ");
  }

  // Honeypot: real users never see or fill this field. Pretend success to bots.
  if (String(form.get("website") ?? "").trim() !== "") return Response.json({ ok: true });

  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const fields = validateReportFields(
    {
      region: form.get("region"),
      month: form.get("month"),
      note: form.get("note"),
      contact: form.get("contact"),
      kind: form.get("kind"),
      place: form.get("place"),
    },
    photos.length,
  );
  if (!fields.ok) return fail(fields.error);

  // Check each photo's real type and the sizes.
  let total = 0;
  const checked: { bytes: Uint8Array; mime: string; ext: string }[] = [];
  for (const file of photos.slice(0, MAX_PHOTOS)) {
    if (file.size > MAX_FILE_BYTES) return fail("ဓာတ်ပုံတစ်ပုံ ကြီးလွန်းသည်");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectImageType(bytes);
    if (!type) return fail("JPG, PNG, WebP ဓာတ်ပုံများသာ ပို့နိုင်သည်");
    total += bytes.length;
    checked.push({ bytes, ...type });
  }
  if (total > MAX_TOTAL_BYTES) return fail("ဓာတ်ပုံများ စုစုပေါင်း ကြီးလွန်းသည်");

  const supabase = createServiceClient();

  // A listed region must exist; an unlisted place (region null) is free text.
  const { data: region, error: regionError } = fields.data.region
    ? await supabase
        .from("regions")
        .select("code,name_mm")
        .eq("code", fields.data.region)
        .maybeSingle()
    : { data: null, error: null };
  if (regionError) {
    // A database/setup problem, not the user's mistake (e.g. 006_reports.sql not run).
    console.error("report region lookup failed", regionError);
    return fail("Server ပြင်ဆင်မှု မပြည့်စုံသေးပါ။ Admin ကို အကြောင်းကြားပါ", 500);
  }
  if (fields.data.region && !region) return fail("မြို့ မမှန်ပါ");

  // Per-device rate limit (hashed IP), counted from the database.
  const hash = ipHash(request);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("schedule_reports")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", hash)
    .gte("created_at", since);
  if (countError) {
    console.error("report rate-limit check failed", countError);
    return fail("Server ပြင်ဆင်မှု မပြည့်စုံသေးပါ။ Admin ကို အကြောင်းကြားပါ", 500);
  }
  if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    return fail("ခဏစောင့်ပါ။ တစ်နာရီအတွင်း အကြိမ်များလွန်းနေသည်", 429);
  }

  const id = randomUUID();
  const paths: string[] = [];
  for (const [i, photo] of checked.entries()) {
    const path = `${id}/${i + 1}.${photo.ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, photo.bytes, { contentType: photo.mime, upsert: false });
    if (error) {
      console.error("report photo upload failed", error);
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      return fail("ဓာတ်ပုံ တင်၍ မရပါ။ ပြန်ကြိုးစားပါ", 500);
    }
    paths.push(path);
  }

  const { error: insertError } = await supabase.from("schedule_reports").insert({
    id,
    region: region?.code ?? null,
    place: fields.data.place,
    kind: fields.data.kind,
    month: fields.data.month,
    note: fields.data.note,
    contact: fields.data.contact,
    photo_paths: paths,
    ip_hash: hash,
  });
  if (insertError) {
    console.error("report insert failed", insertError);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    return fail("သိမ်း၍ မရပါ။ ပြန်ကြိုးစားပါ", 500);
  }

  // Saved. The email is a notification: failure must not fail the request.
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.data.contact) ? fields.data.contact : null;
  await sendReportEmail(
    {
      kind: fields.data.kind,
      regionName: region?.name_mm ?? fields.data.place,
      month: fields.data.month,
      note: fields.data.note,
      contact: fields.data.contact,
      photoCount: checked.length,
    },
    checked.map((p, i) => ({ filename: `photo-${i + 1}.${p.ext}`, bytes: p.bytes })),
    replyTo,
  );

  return Response.json({ ok: true });
}
