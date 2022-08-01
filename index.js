const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const ObjectId = require('mongodb').ObjectId;
const app = express();
require("dotenv").config();
const { MongoClient } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${pass}@cluster0.6w64q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
    // console.log(decoded.foo)
  });
}

async function run() {
  try {
    await client.connect();
    const database = client.db("doctors_portal");
    const appointmentCollection = database.collection("appointment");
    const usersCollection = database.collection("users");

    //load data from database
    app.get("/appointments", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const date = req.query.date;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email, date: date };
        const cursor = appointmentCollection.find(query);
        const appointments = await cursor.toArray();
        return res.send(appointments);
      } else {
        return res.status(401).send("Forbidden Access");
      }
    });

    app.get("/users", verifyJWT, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    //sending appointment data to database
    app.post("/appointments", async (req, res) => {
      const appointmentData = req.body;
      const result = await appointmentCollection.insertOne(appointmentData);
      res.json(result);
    });

    //sending users data to users collection
    // app.post("/users", async (req, res) => {
    //   const userData = req.body;
    //   const result = await usersCollection.insertOne(userData);
    //   res.json(result);
    // });

    app.put('/users/admin/:email', async (req, res) =>{
      const email = req.params.email;
      const filter = {email:email};
      const updateDoc = { $set: {role:'admin'} };
      const result = await usersCollection.updateOne( filter, updateDoc );
      res.send(result);
    })

    app.put("/users", async (req, res) => {
      const userData = req.body;
      const filter = { email: userData.email };
      const options = { upsert: true };
      const updateDoc = { $set: userData };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: userData.email },
        process.env.ACCESS_SECRET_TOKEN,
        { expiresIn: "1hr" }
      );
      res.json({ result, token });
    });


    //delete data from DB
    app.delete("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id : ObjectId(id) }
      const result = await appointmentCollection.deleteOne(query);
      if (result.deletedCount === 1) {
        res.json(result)

      } else {
        res.json({error:"No documents matched the query. Deleted 0 documents."});
      }
    })


    console.log("Database Connected Successfully");
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Doctors Portal Server Is Running");
});

app.listen(port, () => {
  console.log("Listening on port", port);
});
