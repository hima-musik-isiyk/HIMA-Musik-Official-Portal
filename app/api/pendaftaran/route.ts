import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PendaftaranPayload = {
  intent?: string;
  data?: {
    firstChoice?: string;
    secondChoice?: string;
    angkatan?: string;
    pddSubfocus?: string;
    fullName?: string;
    nim?: string;
    email?: string;
    phone?: string;
    instagram?: string;
    motivation?: string;
    experience?: string;
    availability?: string[];
    portfolio?: string;
    submittedAt?: string;
  };
};

const MIN_MOTIVATION_CHARS = 100;
const MAX_MOTIVATION_CHARS = 1500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIM_PATTERN = /^\d{10,12}$/;
const PHONE_PATTERN = /^(?:\+62|62|0)8\d{7,11}$/;

const divisionLabels: Record<string, string> = {
  humas: "Humas & Kemitraan",
  "program-event": "Divisi Program & Event",
  pdd: "Publikasi, Desain & Dokumentasi",
  "co-sekretaris": "Co-Sekretaris",
  "co-bendahara": "Co-Bendahara",
};

const VALID_ANGKATAN = ["2023", "2024", "2025"];
const ANGKATAN_RESTRICTED_POSITIONS = ["co-sekretaris", "co-bendahara"];
const VALID_PDD_SUBFOCUS = ["desain", "publikasi", "dokumentasi"];

const pddSubfocusLabels: Record<string, string> = {
  desain: "Desain",
  publikasi: "Publikasi & Media Sosial",
  dokumentasi: "Dokumentasi",
};

const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);

const pendaftaranCooldownMs = 5 * 60 * 1000;

const pendaftaranLastSubmit = new Map<string, number>();

type LegacyPendaftaranInsertData = {
  firstChoice: string;
  secondChoice: string;
  fullName: string;
  nim: string;
  email: string;
  phone: string;
  instagram: string;
  motivation: string;
  experience: string;
  availability: string[];
  portfolio: string;
  submittedAt: Date;
};

const isMissingColumnError = (error: unknown, column: string) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2022") {
    return false;
  }

  const meta = error.meta as { column?: unknown } | undefined;
  return typeof meta?.column === "string" && meta.column.includes(column);
};

const createLegacyPendaftaranRecord = async (
  payload: LegacyPendaftaranInsertData,
) => {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Pendaftaran" ("id", "firstChoice", "secondChoice", "fullName", "nim", "email", "phone", "instagram", "motivation", "experience", "availability", "portfolio", "submittedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    randomUUID(),
    payload.firstChoice,
    payload.secondChoice || null,
    payload.fullName,
    payload.nim || null,
    payload.email,
    payload.phone || null,
    payload.instagram || null,
    payload.motivation || null,
    payload.experience || null,
    payload.availability,
    payload.portfolio || null,
    payload.submittedAt,
  );
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as PendaftaranPayload;
    const { intent, data } = body;

    if (intent !== "submit-pendaftaran") {
      return NextResponse.json(
        { error: "Invalid submit intent" },
        { status: 400 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Missing registration data" },
        { status: 400 },
      );
    }

    const firstChoice =
      typeof data.firstChoice === "string" ? data.firstChoice.trim() : "";
    const secondChoice =
      typeof data.secondChoice === "string" ? data.secondChoice.trim() : "";
    const angkatan =
      typeof data.angkatan === "string" ? data.angkatan.trim() : "";
    const pddSubfocus =
      typeof data.pddSubfocus === "string" ? data.pddSubfocus.trim() : "";
    const fullName =
      typeof data.fullName === "string" ? data.fullName.trim() : "";
    const nim = typeof data.nim === "string" ? data.nim.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim().replace(/\D/g, "") : "";
    const instagram =
      typeof data.instagram === "string" ? data.instagram.trim() : "";
    const motivation =
      typeof data.motivation === "string" ? data.motivation.trim() : "";
    const experience =
      typeof data.experience === "string" ? data.experience.trim() : "";
    const availability = Array.isArray(data.availability)
      ? data.availability
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    const portfolio =
      typeof data.portfolio === "string" ? data.portfolio.trim() : "";
    const isPddSelected = firstChoice === "pdd" || secondChoice === "pdd";

    if (!firstChoice) {
      return NextResponse.json(
        { error: "Divisi prioritas 1 wajib dipilih." },
        { status: 400 },
      );
    }

    if (secondChoice && secondChoice === firstChoice) {
      return NextResponse.json(
        { error: "Divisi prioritas 2 harus berbeda dari prioritas 1." },
        { status: 400 },
      );
    }

    if (!angkatan || !VALID_ANGKATAN.includes(angkatan)) {
      return NextResponse.json(
        { error: "Angkatan wajib dipilih (2023, 2024, atau 2025)." },
        { status: 400 },
      );
    }

    if (
      ANGKATAN_RESTRICTED_POSITIONS.includes(firstChoice) &&
      angkatan === "2023"
    ) {
      return NextResponse.json(
        {
          error:
            "Posisi Co-Sekretaris dan Co-Bendahara hanya tersedia untuk angkatan 2024\u20132025.",
        },
        { status: 400 },
      );
    }

    if (pddSubfocus && !VALID_PDD_SUBFOCUS.includes(pddSubfocus)) {
      return NextResponse.json(
        { error: "Sub-fokus PDD tidak valid." },
        { status: 400 },
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi." },
        { status: 400 },
      );
    }

    if (!nim) {
      return NextResponse.json(
        { error: "NIM wajib diisi." },
        { status: 400 },
      );
    }

    if (!NIM_PATTERN.test(nim)) {
      return NextResponse.json(
        { error: "NIM harus 10–12 digit angka." },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email wajib diisi." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 },
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Nomor WhatsApp wajib diisi." },
        { status: 400 },
      );
    }

    if (!PHONE_PATTERN.test(phone)) {
      return NextResponse.json(
        { error: "Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx." },
        { status: 400 },
      );
    }

    if (!motivation) {
      return NextResponse.json(
        { error: "Motivasi wajib diisi." },
        { status: 400 },
      );
    }

    if (
      motivation.length < MIN_MOTIVATION_CHARS ||
      motivation.length > MAX_MOTIVATION_CHARS
    ) {
      return NextResponse.json(
        {
          error: `Motivasi harus ${MIN_MOTIVATION_CHARS}–${MAX_MOTIVATION_CHARS} karakter.`,
        },
        { status: 400 },
      );
    }

    if (availability.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal satu ketersediaan waktu." },
        { status: 400 },
      );
    }

    const now = Date.now();
    const lastSubmit = pendaftaranLastSubmit.get(email) ?? 0;
    const elapsed = now - lastSubmit;

    if (elapsed < pendaftaranCooldownMs) {
      const retryAfterMs = pendaftaranCooldownMs - elapsed;
      return NextResponse.json(
        {
          error:
            "Kamu baru saja mengirim pendaftaran. Coba lagi beberapa menit lagi.",
          retryAfterMs,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
          },
        },
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "musikisiyk@gmail.com";
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!apiKey || !fromEmail) {
      console.error("Missing email configuration", {
        hasApiKey: !!apiKey,
        hasFromEmail: !!fromEmail,
      });
      return NextResponse.json(
        { error: "Server misconfiguration: Email is not configured" },
        { status: 500 },
      );
    }

    const subject = "Bukti Pendaftaran HIMA Musik";

    const submittedAt = new Date();

    const submittedAtFormatted = submittedAt.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const divisionLabel = divisionLabels[firstChoice] ?? firstChoice;
    const secondaryDivisionLabel = secondChoice
      ? divisionLabels[secondChoice] ?? secondChoice
      : "";
    const subfocusLabel =
      isPddSelected && pddSubfocus
        ? pddSubfocusLabels[pddSubfocus] ?? pddSubfocus
        : "";
    const safeFullName = escapeHtml(fullName || "Calon Pengurus");
    const safeEmail = escapeHtml(email);
    const safeNim = escapeHtml(nim);
    const safePhone = escapeHtml(phone);
    const safeInstagram = escapeHtml(instagram);
    const safeDivisionLabel = escapeHtml(divisionLabel || "-");
    const safeSecondaryDivisionLabel = escapeHtml(secondaryDivisionLabel);
    const safeSubfocusLabel = escapeHtml(subfocusLabel);
    const safeAngkatan = escapeHtml(angkatan);
    const safeAvailability = availability.map((item) => escapeHtml(item));
    const safePortfolio = escapeHtml(portfolio);
    const safeMotivation = escapeHtml(motivation);
    const safeExperience = escapeHtml(experience);
    const safeMotivationHtml = safeMotivation.replace(/\n/g, "<br />");
    const safeExperienceHtml = safeExperience.replace(/\n/g, "<br />");

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #050505; color: #e5e5e5; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #0b0b0b; border: 1px solid rgba(255,255,255,0.08); padding: 24px; border-radius: 16px;">
          <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #d4a64d; margin: 0 0 16px;">
            Bukti Pendaftaran
          </p>
          <h1 style="font-size: 24px; margin: 0 0 16px; color: #f5f5f5;">
            Terima kasih, ${safeFullName}.
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; margin: 0 0 20px;">
            Pendaftaran kamu sebagai calon pengurus HIMA Musik telah kami terima.
            Tim akan menghubungi kamu melalui email atau WhatsApp untuk informasi tahap berikutnya.
          </p>
          <div style="border: 1px solid rgba(255,255,255,0.08); background-color: rgba(255,255,255,0.02); padding: 16px; margin-bottom: 20px; border-radius: 12px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Ringkasan Pendaftaran
            </p>
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Nama:</strong> ${safeFullName || "-"}</p>
            ${nim ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>NIM:</strong> ${safeNim}</p>` : ""}
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Waktu:</strong> ${submittedAtFormatted}</p>
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Divisi prioritas 1:</strong> ${safeDivisionLabel}</p>
            ${
              secondaryDivisionLabel
                ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>Divisi prioritas 2:</strong> ${safeSecondaryDivisionLabel}</p>`
                : ""
            }
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Angkatan:</strong> ${safeAngkatan}</p>
            ${
              subfocusLabel
                ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>Sub-fokus PDD:</strong> ${safeSubfocusLabel}</p>`
                : ""
            }
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Email:</strong> ${safeEmail}</p>
            ${phone ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>WhatsApp:</strong> ${safePhone}</p>` : ""}
            ${instagram ? `<p style="font-size: 14px; margin: 0;"><strong>Instagram:</strong> ${safeInstagram}</p>` : ""}
          </div>
          <div style="border: 1px solid rgba(255,255,255,0.06); background-color: rgba(255,255,255,0.01); padding: 16px; margin-bottom: 20px; border-radius: 12px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Motivasi
            </p>
            <p style="font-size: 13px; margin: 0; color: #d4d4d4; white-space: pre-line;">
              ${safeMotivationHtml}
            </p>
          </div>
          ${
            experience
              ? `
          <div style="border: 1px solid rgba(255,255,255,0.06); background-color: rgba(255,255,255,0.01); padding: 16px; margin-bottom: 20px; border-radius: 12px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Pengalaman
            </p>
            <p style="font-size: 13px; margin: 0; color: #d4d4d4; white-space: pre-line;">
              ${safeExperienceHtml}
            </p>
          </div>
              `
              : ""
          }
          ${
            availability.length > 0
              ? `
          <div style="border: 1px solid rgba(255,255,255,0.06); background-color: rgba(255,255,255,0.01); padding: 16px; margin-bottom: 20px; border-radius: 12px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Ketersediaan Waktu
            </p>
            <p style="font-size: 13px; margin: 0; color: #d4d4d4;">
              ${safeAvailability.join(", ")}
            </p>
          </div>
              `
              : ""
          }
          ${
            portfolio
              ? `
          <div style="border: 1px solid rgba(255,255,255,0.06); background-color: rgba(255,255,255,0.01); padding: 16px; margin-bottom: 20px; border-radius: 12px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Portofolio / Lampiran
            </p>
            <p style="font-size: 13px; margin: 0; color: #d4d4d4; white-space: pre-line;">
              ${safePortfolio}
            </p>
          </div>
              `
              : ""
          }
          <p style="font-size: 12px; line-height: 1.6; color: #737373; margin: 0 0 12px;">
            Simpan email ini sebagai bukti pendaftaran. Jika ada data yang tidak sesuai,
            kamu bisa membalas email ini ke panitia.
          </p>
          <p style="font-size: 12px; line-height: 1.6; color: #737373; margin: 0 0 16px;">
            Jika email ini muncul di folder <span style="color:#e5e5e5;">Spam</span> atau
            <span style="color:#e5e5e5;">Junk</span>, tandai sebagai
            <span style="color:#e5e5e5;"> “Bukan spam” </span> dan pindahkan ke kotak masuk
            utama supaya informasi berikutnya tidak terlewat.
          </p>
          <p style="font-size: 12px; line-height: 1.6; color: #525252; margin: 0;">
            Salam hangat,<br/>
            HIMA Musik
          </p>
        </div>
      </div>
    `;

    const textLines = [
      "Bukti Pendaftaran HIMA Musik",
      "",
      `Nama           : ${fullName || "-"}`,
      nim ? `NIM            : ${nim}` : "",
      `Waktu          : ${submittedAtFormatted}`,
      `Divisi prio 1  : ${divisionLabel}`,
      secondaryDivisionLabel
        ? `Divisi prio 2  : ${secondaryDivisionLabel}`
        : "",
      `Angkatan       : ${angkatan}`,
      subfocusLabel ? `Sub-fokus PDD  : ${subfocusLabel}` : "",
      `Email          : ${email}`,
      phone ? `WhatsApp       : ${phone}` : "",
      instagram ? `Instagram      : ${instagram}` : "",
      availability.length > 0
        ? `Ketersediaan   : ${availability.join(", ")}`
        : "",
      motivation ? `Motivasi      : ${motivation}` : "",
      experience ? `Pengalaman    : ${experience}` : "",
      portfolio ? `Portofolio    : ${portfolio}` : "",
      "",
      "Simpan email ini sebagai bukti pendaftaran.",
      "Jika email ini masuk ke folder Spam/Junk, tandai sebagai \"Bukan spam\"",
      "agar informasi berikutnya tidak terlewat.",
      "",
      "Salam hangat,",
      "HIMA Musik",
    ].filter(Boolean);

    const text = textLines.join("\n");

    const brevoPayload = {
      sender: {
        email: fromEmail,
      },
      to: [
        {
          email,
          name: fullName || email,
        },
      ],
      ...(adminEmail
        ? {
            bcc: [
              {
                email: adminEmail,
              },
            ],
          }
        : {}),
      subject,
      htmlContent: html,
      textContent: text,
    };

    pendaftaranLastSubmit.set(email, now);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("Email API error", {
        status: response.status,
        body: responseText,
      });
      return NextResponse.json(
        { error: "Failed to send registration email" },
        { status: 500 },
      );
    }

    let dbWriteError: unknown = null;

    try {
      await prisma.pendaftaran.create({
        data: {
          firstChoice,
          secondChoice: secondChoice || null,
          angkatan,
          pddSubfocus: isPddSelected && pddSubfocus ? pddSubfocus : null,
          fullName: fullName || "",
          nim: nim || null,
          email,
          phone: phone || null,
          instagram: instagram || null,
          motivation: motivation || null,
          experience: experience || null,
          availability,
          portfolio: portfolio || null,
          submittedAt,
        },
      });
    } catch (dbError) {
      const isLegacySchemaError =
        isMissingColumnError(dbError, "angkatan") ||
        isMissingColumnError(dbError, "pddSubfocus");

      if (isLegacySchemaError) {
        try {
          await createLegacyPendaftaranRecord({
            firstChoice,
            secondChoice,
            fullName,
            nim,
            email,
            phone,
            instagram,
            motivation,
            experience,
            availability,
            portfolio,
            submittedAt,
          });
        } catch (legacyDbError) {
          dbWriteError = legacyDbError;
        }
      } else {
        dbWriteError = dbError;
      }
    }

    if (dbWriteError) {
      console.error("DB write failed (pendaftaran):", dbWriteError);

      const errorToken = process.env.TELEGRAM_BOT_TOKEN;
      const errorChatId = process.env.TELEGRAM_CHAT_ID;
      const errorTopicIdRaw =
        process.env.TELEGRAM_PENDAFTARAN_TOPIC_ID ??
        process.env.TELEGRAM_ERROR_TOPIC_ID;

      if (errorToken && errorChatId) {
        const errorText = [
          "\u26a0\ufe0f *DB WRITE FAILED \\- PENDAFTARAN*",
          "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
          `\ud83d\udc64 *Nama:* ${escapeHtml(fullName).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")}`,
          `\ud83c\udd94 *NIM:* ${escapeHtml(nim).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")}`,
          `\ud83d\udce7 *Email:* ${escapeHtml(email).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")}`,
          `\ud83c\udfaf *Divisi:* ${escapeHtml(divisionLabel).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")}`,
          "",
          "\u2757 Email berhasil terkirim tetapi data TIDAK tersimpan di database\\.",
          "Manual data entry required\\.",
        ].join("\n");

        const errorPayload: Record<string, unknown> = {
          chat_id: errorChatId,
          text: errorText,
          parse_mode: "MarkdownV2",
        };

        const topicId = errorTopicIdRaw ? Number(errorTopicIdRaw) : undefined;
        if (typeof topicId === "number" && Number.isInteger(topicId) && topicId !== 0) {
          errorPayload.message_thread_id = topicId;
        }

        try {
          await fetch(`https://api.telegram.org/bot${errorToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(errorPayload),
          });
        } catch (telegramError) {
          console.error("Failed to send DB error notification to Telegram:", telegramError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling registration email", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
