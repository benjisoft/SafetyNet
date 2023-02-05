/* eslint-disable max-len */
const functions = require("firebase-functions");
// eslint-disable-next-line no-unused-vars
const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
// eslint-disable-next-line no-unused-vars
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");
require("dotenv").config();
const cors = require("cors")({ origin: true });
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

initializeApp();

const db = getFirestore();

exports.newConfig = functions
  .region("europe-west1")
  .https.onRequest((req, res) => {
    cors(req, res, () => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE"
      );
      const data = {
        // "checkFrequency": req.body.checkFrequency,
        recipients: req.body.recipients,
        userNumber: req.body.userNumber,
        name: req.body.name,
        active: true,
        nextCheck: Timestamp.fromDate(new Date(Date.now())),
        waitingForResponse: true,
      };
      db.collection("alerts")
        .add(data)
        .then(() => {
          res.status(200);
        });
    });
  });

exports.disableAlerts = functions
  .region("europe-west1")
  .https.onRequest((req, res) => {
    cors(req, res, () => {
      db.collection("alerts")
        .where("userNumber", "==", req.body.userNumber)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            db.collection("alerts").doc(doc.id).update({ active: false });
          });
        });
    });
  });

exports.enableAlerts = functions
  .region("europe-west1")
  .https.onRequest((req, res) => {
    cors(req, res, () => {
      db.collection("alerts")
        .where("userNumber", "==", req.body.userNumber)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            db.collection("alerts").doc(doc.id).update({ active: true });
          });
        });
    });
  });

exports.checkNotifs = functions
  .region("europe-west1")
  .pubsub.schedule("every 1 minutes")
  .onRun((context) => {
    functions.logger.log("Run checkNotifs");
    db.collection("alerts")
      .where("nextCheck", "<=", Timestamp.now())
      .where("active", "==", true)
      .get()
      .then((querySnapshot) => {
        functions.logger.log("Found alerts");
        const nextCheck = Timestamp.fromDate(new Date(Date.now() + 60000));
        querySnapshot.forEach((doc) => {
          functions.logger.log("Found doc");
          const data = doc.data();
          if (data.waitingForResponse == true) {
            const data = doc.data();
            db.collection("alerts").doc(doc.id).update({
              nextCheck: nextCheck,
              waitingForResponse: true,
            });
            data.recipients.forEach((recipient) => {
              client.messages
                .create({
                  body: `${data.name} has not responded to a SafetyNet check. Please get in touch to check they are okay.`,
                  from: "+447723461766",
                  to: `+${recipient.number}`,
                })
                .then((message) => console.log(message.sid));
            });
          } else {
            db.collection("alerts").doc(doc.id).update({
              nextCheck: nextCheck,
              waitingForResponse: true,
            });
            client.messages
              .create({
                body: 'Please confirm you are ok. You have one minute from now before your emergency contacts are alerted. Please respond with "SAFE" if you are safe.',
                from: "+447723461766",
                to: `+${data.usernumber}`,
              })
              .then((message) => console.log(message.sid));
          }
        });
      });
  });

exports.textReceived = functions
  .region("europe-west1")
  .https.onRequest((req, res) => {
    cors(req, res, () => {
      if (req.body.Body.toUpperCase() === "SAFE") {
        db.collection("alerts")
          .where("userNumber", "==", req.body.From)
          .where("waitingForResponse", "==", true)
          .get()
          .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              db.collection("perm").doc(doc.id).update({
                waitingForResponse: false,
              });
            });
          });
      }
    });
  });
