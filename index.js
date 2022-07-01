require('dotenv').config();
const express = require('express');
const {
  OAuth2Client,
  UserRefreshClient,
  IdTokenClient,
} = require('google-auth-library');
const axios = require('axios');
const url = require('url');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const oAuth2Client = new OAuth2Client(
  clientId,
  clientSecret,
  // 'http://localhost:3001/oauth2callback', //'postmessage' if using authorization code flow with popup mode
  'postmessage',
);

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// redirect mode (personalized button)
app.post('/oauth2callback', async (req, res) => {
  res
    .cookie('@react-oauth/google_ACCESS_TOKEN', req.body.credential, {
      maxAge: 1 * 60 * 60 * 1000,
    })
    .redirect(301, 'http://localhost:3000/');
});

// redirect mode (authorization code flow) (custom button)
app.get('/oauth2callback', async (req, res) => {
  const today = new Date();
  const { tokens } = await oAuth2Client.getToken(req.query.code);
  res
    .cookie('@react-oauth/google_ACCESS_TOKEN', tokens.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: 1 * 60 * 60 * 1000,
    })
    .cookie('@react-oauth/google_REFRESH_TOKEN', tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      expires: new Date(today.getFullYear(), today.getMonth() + 6),
    })
    .redirect(301, 'http://localhost:3000/');
});

/** Popup mode */

app.post('/auth/google', async (req, res) => {
  const today = new Date();
  const { tokens } = await oAuth2Client.getToken(req.body.code);

  console.log(tokens);

  res
    // .cookie('@react-oauth/google_ACCESS_TOKEN', tokens.access_token, {
    //   httpOnly: true,
    //   secure: true,
    //   maxAge: 1 * 60 * 60 * 1000,
    // })
    // .cookie('@react-oauth/google_REFRESH_TOKEN', tokens.refresh_token, {
    //   httpOnly: true,
    //   secure: true,
    //   expires: new Date(today.getFullYear(), today.getMonth() + 6),
    // })
    .json(tokens);

  // without google-auth-library
  // const body = new URLSearchParams({
  //   code: '4/0AX4XfWgTgaGdYRY28LMT8Xlu3t1QBzUejcyOy0wHq8zaFjZoLffopQTgranqRPJnxBQ5mg',
  //   client_id: clientId,
  //   client_secret: clientSecret,
  //   grant_type: 'authorization_code',
  //   redirect_uri: 'postmessage',
  // });

  // const { data } = await axios.post(
  //   'https://oauth2.googleapis.com/token',
  //   body,
  //   { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  // );
  // res.json(data);
});

app.post('/auth/google/refresh-token', async (req, res) => {
  const user = new UserRefreshClient(
    clientId,
    clientSecret,
    req.body.refreshToken,
  );
  const { credentials } = await user.refreshAccessToken();
  res.json(credentials);

  // without google-auth-library
  // const body = new URLSearchParams({
  //   client_id: clientId,
  //   client_secret: clientSecret,
  //   grant_type: 'refresh_token',
  //   refresh_token: req.body.refreshToken,
  //   redirect_uri: 'postmessage',
  // });

  // const { data } = await axios.post(
  //   'https://oauth2.googleapis.com/token',
  //   body,
  //   {
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //     },
  //   },
  // );
});

app.listen(3001, () => console.log(`server is running on port 3001`));
