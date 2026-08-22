const router = require("express").Router();
const { google } = require("googleapis");
const { auth } = require("../middleware/auth");

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

router.get("/google", auth, (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google Calendar is not configured" });
  const client = oauthClient();
  const state = Buffer.from(String(req.user._id)).toString("base64url");
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
    state,
    prompt: "consent"
  });
  res.json({ url });
});

router.get("/google/callback", async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).send("Google Calendar is not configured");
  try {
    const client = oauthClient();
    const { tokens } = await client.getToken(req.query.code);
    const User = require("../models/User");
    const userId = Buffer.from(req.query.state, "base64url").toString();
    await User.findByIdAndUpdate(userId, { googleRefreshToken: tokens.refresh_token });
    res.redirect(`${process.env.CLIENT_URL}/calendar-connected`);
  } catch {
    res.status(400).send("Google Calendar authorization failed");
  }
});

module.exports = router;
