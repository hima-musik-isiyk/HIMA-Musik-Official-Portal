import { google } from "googleapis";

let auth;

export const getCalendar = () => {
  if (auth) return google.calendar({ version: "v3", auth });

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment.");
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    return google.calendar({ version: "v3", auth });
  } catch (error: any) {
    console.error("Failed to initialize Google Auth:", error);
    throw new Error(`Failed to initialize Google Auth: ${error.message}`);
  }
};
