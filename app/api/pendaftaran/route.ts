import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PendaftaranPayload = {
  intent?: string;
  data?: {
    firstChoice?: string;
    secondChoice?: string;
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

const pendaftaranCooldownMs = 5 * 60 * 1000;

const pendaftaranLastSubmit = new Map<string, number>();

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

    const email = typeof data.email === "string" ? data.email.trim() : "";
    const fullName =
      typeof data.fullName === "string" ? data.fullName.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    const submittedAt =
      typeof data.submittedAt === "string" && data.submittedAt
        ? new Date(data.submittedAt)
        : new Date();

    const submittedAtFormatted = submittedAt.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

    const divisionName = data.firstChoice || "-";
    const secondaryDivisionName =
      typeof data.secondChoice === "string" ? data.secondChoice.trim() : "";
    const nim = typeof data.nim === "string" ? data.nim.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const instagram =
      typeof data.instagram === "string" ? data.instagram.trim() : "";
    const availability = Array.isArray(data.availability)
      ? data.availability.filter((item) => typeof item === "string" && item.trim())
      : [];
    const portfolio =
      typeof data.portfolio === "string" ? data.portfolio.trim() : "";

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #050505; color: #e5e5e5; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #0b0b0b; border: 1px solid rgba(255,255,255,0.08); padding: 24px; border-radius: 16px;">
          <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #d4a64d; margin: 0 0 16px;">
            Bukti Pendaftaran
          </p>
          <h1 style="font-size: 24px; margin: 0 0 16px; color: #f5f5f5;">
            Terima kasih, ${fullName || "Calon Pengurus"}.
          </h1>
          <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; margin: 0 0 20px;">
            Pendaftaran kamu sebagai calon pengurus HIMA Musik telah kami terima.
            Tim akan menghubungi kamu melalui email atau WhatsApp untuk informasi tahap berikutnya.
          </p>
          <div style="border: 1px solid rgba(255,255,255,0.08); background-color: rgba(255,255,255,0.02); padding: 16px; margin-bottom: 20px; border-radius: 12px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Ringkasan Pendaftaran
            </p>
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Nama:</strong> ${fullName || "-"}</p>
            ${nim ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>NIM:</strong> ${nim}</p>` : ""}
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Waktu:</strong> ${submittedAtFormatted}</p>
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Divisi prioritas 1:</strong> ${divisionName}</p>
            ${
              secondaryDivisionName
                ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>Divisi prioritas 2:</strong> ${secondaryDivisionName}</p>`
                : ""
            }
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Email:</strong> ${email}</p>
            ${phone ? `<p style="font-size: 14px; margin: 0 0 4px;"><strong>WhatsApp:</strong> ${phone}</p>` : ""}
            ${instagram ? `<p style="font-size: 14px; margin: 0;"><strong>Instagram:</strong> ${instagram}</p>` : ""}
          </div>
          ${
            availability.length > 0
              ? `
          <div style="border: 1px solid rgba(255,255,255,0.06); background-color: rgba(255,255,255,0.01); padding: 16px; margin-bottom: 20px; border-radius: 12px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Ketersediaan Waktu
            </p>
            <p style="font-size: 13px; margin: 0; color: #d4d4d4;">
              ${availability.join(", ")}
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
              ${portfolio}
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
      `Divisi prio 1  : ${divisionName}`,
      secondaryDivisionName
        ? `Divisi prio 2  : ${secondaryDivisionName}`
        : "",
      `Email          : ${email}`,
      phone ? `WhatsApp       : ${phone}` : "",
      instagram ? `Instagram      : ${instagram}` : "",
      availability.length > 0
        ? `Ketersediaan   : ${availability.join(", ")}`
        : "",
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

    try {
      await prisma.pendaftaran.create({
        data: {
          firstChoice: divisionName,
          secondChoice: secondaryDivisionName || null,
          fullName: fullName || "",
          nim: nim || null,
          email,
          phone: phone || null,
          instagram: instagram || null,
          motivation: typeof data.motivation === "string" ? data.motivation.trim() : null,
          experience: typeof data.experience === "string" ? data.experience.trim() : null,
          availability,
          portfolio: portfolio || null,
          submittedAt,
        },
      });
    } catch (dbError) {
      console.error("DB write failed (pendaftaran):", dbError);
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
