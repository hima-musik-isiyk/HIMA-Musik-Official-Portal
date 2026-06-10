import { google } from "googleapis";

let auth;
try {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment.");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
} catch (error: any) {
  console.error("Failed to initialize Google Auth:", error);
  throw new Error(`Failed to initialize Google Auth: ${error.message}`);
}

export const calendar = google.calendar({ version: "v3", auth });
