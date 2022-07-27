const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient } = require("mongodb");
const port = process.env.PORT ||5000;

// middleware
app.use(cors());
app.use(express.json());
const user = process.env.DB_USER
const pass = process.env.DB_PASS

const uri = `mongodb+srv://${user}:${pass}@cluster0.6w64q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const database = client.db("doctors_portal");
        const appointmentCollection = database.collection("appointment");

     //load data from database
     app.get("/appointments", async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const cursor = appointmentCollection.find(query);
        const appointments = await cursor.toArray();
        res.json(appointments);
     });

     //sending appointment data to database
        app.post("/appointments", async (req, res) => {
            const appointmentData = req.body
            const result = await appointmentCollection.insertOne(appointmentData);
            res.json(result);
        });



        console.log('Database Connected Successfully');
      
    } finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("Doctors Portal Server Is Running");
});



app.listen(port, () =>{
    console.log("Listening on port", port);
});