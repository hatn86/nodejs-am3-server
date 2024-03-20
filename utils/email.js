const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");

// Khoi tao OAuth2Client
const myOAuth2Client = new OAuth2Client(
  process.env.GOOGLE_MAILER_CLIENT_ID,
  process.env.GOOGLE_MAILER_CLIENT_SECRET
);

// set credential cho myOAuth2Client
myOAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
});

exports.sendEmail = async (mailOption) => {
  // Lay access token cho moi lan gui mail
  // do access token tu dong het han sau 1 khoang thoi gian nhat dinh
  const myAccessTokenObject = await myOAuth2Client.getAccessToken();
  const myAccessToken = myAccessTokenObject.token;

  // cau hinh transport
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.ADMIN_EMAIL_ADDRESS,
      clientId: process.env.GOOGLE_MAILER_CLIENT_ID,
      clientSecret: process.env.GOOGLE_MAILER_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_MAILER_REFRESH_TOKEN,
      accessToken: myAccessToken,
    },
  });

  transport.sendMail(mailOption);
};
