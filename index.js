const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

//middleware
app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
    const tokenHeader = req.headers.authentication;
    // console.log(tokenHeader)
    if (!tokenHeader) {
        return res.status(401).send({ message: "Unauthorized Access!" })
    }
    const token = tokenHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access!" })
        }
        req.decoded = decoded;
        next()
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.63b4p.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        await client.connect();
        const activitiesCollection = client.db("volunteerActivities").collection("activities");
        const registeredActivities = client.db("volunteerActivities").collection("registered");

        app.post('/login', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            // console.log(token)
            res.send({ token })
        })

        // GET activities
        app.get('/activities', async (req, res) => {
            const cursor = activitiesCollection.find()
            const activities = await cursor.toArray()

            if (!activities?.length) {
                return res.send({ success: false, error: "No product found" });
            }
            res.send({ success: true, data: activities })
        })
        app.get('/activities/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const activities = await activitiesCollection.findOne(query)
            res.send(activities)
        })
        app.get('/registered', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (decodedEmail === email) {
                const cursor = registeredActivities.find(req.query)
                const registered = await cursor.toArray()
                res.send(registered)
            }
            else {
                return res.status(403).send({ message: "Forbidden Access!" })
            }
        })
        app.get('/registered/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const registered = await registeredActivities.findOne(query)
            res.send(registered)
        })

        // POST
        app.post('/activities', async (req, res) => {
            const body = req.body;
            // console.log(body)
            const activities = await activitiesCollection.insertOne(body)
            res.send(activities)
        })
        app.post('/registered', async (req, res) => {
            const body = req.body;
            // console.log(body)
            const registered = await registeredActivities.insertOne(body)
            res.send(registered)
        })

        // DELETE
        app.delete('/registered/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const registered = await registeredActivities.deleteOne(query)
            res.send(registered)
        })

    }
    catch (error) {
        console.error(error);
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send('Home')
})

app.listen(port, () => {
    console.log("Listening port: ", port)
})