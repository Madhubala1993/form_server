import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

const MONGO_URL = process.env.MONGO_URL;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongo is connected");
  return client;
}

export const client = await createConnection();

app.listen(PORT, () => console.log("Server started on PORT", PORT));

app.get("/", (request, response) => {
  response.send("Hi 😊");
});
app.get("/form", async (request, response) => {
  const formdatas = await getDatas();
  console.log(formdatas);
  response.send(formdatas);
});

app.post("/form", async (request, response) => {
  const formvalues = request.body;

  console.log(formvalues);

  const formdatas = await insertDatas(formvalues);

  let mailid = formvalues.Mail_id;
  console.log(mailid);
  await sendMail(mailid, formvalues, request, response);
});

async function sendMail(mailid, formvalues, req, response) {
  let mailTransporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      type: "OAuth2",
      user: process.env.mail_id,
      pass: process.env.password,
      clientId: process.env.client_id,
      clientSecret: process.env.client_secret,
      refreshToken: process.env.refresh_token,
    },
  });

  let mailDetails = {
    from: "<noReply>",
    to: mailid,
    subject: "Feedback from customer",
    text: `Got Feedback from ${formvalues.Name}
    Phone : ${formvalues.Mobile}
    Email id :${formvalues.Mail_id}
    Comments :  ${formvalues.Comments}`,
  };

  mailTransporter.sendMail(mailDetails, async (err) => {
    if (err) {
      return response.status(400).send("email is not sent");
    }

    return response.send({
      message: "OTP sent to your e-mail",
    });
  });
}

async function getDatas() {
  return await client.db("mimedia").collection("form").find({}).toArray();
}

async function insertDatas(formvalues) {
  return await client.db("mimedia").collection("form").insertOne(formvalues);
}
