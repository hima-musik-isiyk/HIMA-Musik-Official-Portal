import { NextResponse } from "next/server";

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

    const apiKey = process.env.SENDGRID_API_KEY;
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

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #050505; color: #e5e5e5; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #0b0b0b; border: 1px solid rgba(255,255,255,0.08); padding: 24px;">
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
          <div style="border: 1px solid rgba(255,255,255,0.08); background-color: rgba(255,255,255,0.02); padding: 16px; margin-bottom: 20px;">
            <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #737373; margin: 0 0 8px;">
              Ringkasan Pendaftaran
            </p>
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Nama:</strong> ${fullName || "-"}</p>
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Waktu:</strong> ${submittedAtFormatted}</p>
            <p style="font-size: 14px; margin: 0 0 4px;"><strong>Divisi pilihan utama:</strong> ${divisionName}</p>
            <p style="font-size: 14px; margin: 0;"><strong>Email terdaftar:</strong> ${email}</p>
          </div>
          <p style="font-size: 12px; line-height: 1.6; color: #737373; margin: 0 0 16px;">
            Simpan email ini sebagai bukti pendaftaran. Jika ada data yang tidak sesuai,
            kamu bisa membalas email ini ke panitia.
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
      `Nama: ${fullName || "-"}`,
      `Waktu: ${submittedAtFormatted}`,
      `Divisi pilihan utama: ${divisionName}`,
      `Email terdaftar: ${email}`,
    ];

    const text = textLines.join("\n");

    const sgPayload = {
      personalizations: [
        {
          to: [{ email }],
          ...(adminEmail
            ? { bcc: [{ email: adminEmail }] }
            : {}),
        },
      ],
      from: {
        email: fromEmail,
      },
      reply_to: {
        email: fromEmail,
      },
      subject,
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sgPayload),
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling registration email", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
