/**
 * Brevo Transactional Email Service
 * Sends styled email copies of form submissions to respondents.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

export async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
}: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "musikisiyk@gmail.com";

  if (!apiKey) {
    console.error(
      "[Brevo Email] Missing BREVO_API_KEY in environment variables.",
    );
    return false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "HIMA Musik Official Portal", email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Brevo API responded with status ${res.status}: ${errorText}`,
      );
    }

    console.warn(`[Brevo Email] Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("[Brevo Email] Failed to send email:", error);
    return false;
  }
}

export function generateKaryaEmailTemplate({
  title,
  creator,
  nim,
  platform,
  genres,
  embedLink,
  status,
  submissionTime,
}: {
  title: string;
  creator: string;
  nim: string | number;
  platform: string;
  genres: string;
  embedLink: string;
  status: string;
  submissionTime: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Copy of Your Karya Submission</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #0a0a0a;
            color: #e5e5e5;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #111111;
            border: 1px solid #222222;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #222222;
            padding-bottom: 25px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-family: 'Outfit', Georgia, serif;
            color: #ffffff;
            font-size: 26px;
            font-weight: 600;
            margin: 0 0 10px 0;
          }
          .header p {
            color: #d4a64d;
            font-size: 13px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin: 0;
            font-weight: 500;
          }
          .intro {
            font-size: 15px;
            line-height: 1.6;
            color: #a3a3a3;
            margin-bottom: 30px;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
            background-color: #0d0d0d;
            border: 1px solid #1a1a1a;
          }
          .details-table th, .details-table td {
            padding: 15px 20px;
            text-align: left;
            border-bottom: 1px solid #1a1a1a;
          }
          .details-table th {
            color: #737373;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            width: 35%;
            vertical-align: top;
          }
          .details-table td {
            color: #ffffff;
            font-size: 14px;
            word-break: break-all;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background-color: rgba(212, 166, 77, 0.1);
            color: #d4a64d;
            border: 1px solid rgba(212, 166, 77, 0.2);
            border-radius: 4px;
          }
          .btn-container {
            text-align: center;
            margin-bottom: 35px;
          }
          .btn {
            display: inline-block;
            background-color: rgba(212, 166, 77, 0.1);
            color: #d4a64d;
            border: 1px solid rgba(212, 166, 77, 0.3);
            padding: 12px 28px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            transition: all 0.3s ease;
          }
          .footer {
            border-top: 1px solid #222222;
            padding-top: 25px;
            text-align: center;
            font-size: 12px;
            color: #525252;
            line-height: 1.5;
          }
          .footer a {
            color: #d4a64d;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Copy of Karya Submission</h1>
            <p>HIMA Musik ISI Yogyakarta</p>
          </div>

          <p class="intro">
            Halo <strong>${creator}</strong>,<br><br>
            Terima kasih telah membagikan karyamu dengan Himpunan Mahasiswa Musik ISI Yogyakarta! Ini adalah salinan pengajuan karyamu yang berhasil kami terima di dalam CMS. Tim kami akan segera meninjau pengajuanmu.
          </p>

          <table class="details-table">
            <tr>
              <th>Band/Artist & Judul</th>
              <td>${title}</td>
            </tr>
            <tr>
              <th>Pencipta / Penampil</th>
              <td>${creator}</td>
            </tr>
            <tr>
              <th>NIM Penanggung Jawab</th>
              <td>${nim}</td>
            </tr>
            <tr>
              <th>Platform Utama</th>
              <td>${platform}</td>
            </tr>
            <tr>
              <th>Genre / Jenis Karya</th>
              <td>${genres}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td><span class="status-badge">${status}</span></td>
            </tr>
            <tr>
              <th>Submission Time</th>
              <td>${submissionTime}</td>
            </tr>
          </table>

          <div class="btn-container">
            <a href="${embedLink}" target="_blank" class="btn">Buka Tautan Embed</a>
          </div>

          <div class="footer">
            Himpunan Mahasiswa Musik (HIMA MUSIK) ISI Yogyakarta<br>
            Kabinet 2026 · <a href="https://www.himamusik.org">himamusik.org</a>
          </div>
        </div>
      </body>
    </html>
  `;
}
