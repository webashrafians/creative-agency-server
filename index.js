const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

// mongodb connection............................
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g7kps.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();


// creative agency server functionality..........
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("services"));
app.use(fileUpload());

//server port........................
const port = 5000;

//home directory.................................
app.get("/", (req, res) => {
  res.send("Creative Agency mongodb and heroku is connected");
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const serviceCollection = client.db("creative-agency").collection("services");
  const reviewCollection = client.db("creative-agency").collection("review");
  const orderCollection = client.db("creative-agency").collection("order");
  const adminCollection = client.db("creative-agency").collection("admin");

  // addReview..........................
  app.post("/addReview", (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review)
    .then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //reviewList..........................
  app.get("/reviewList", (req, res) => {
    reviewCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
    });
  });

  //addOrder...........................
  app.post("/addOrder", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const projectTitle = req.body.projectTitle;
    const projectDetails = req.body.projectDetails;
    const price = req.body.price;
    const status = req.body.status;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    // console.log(file, name, email, projectTitle, projectDetails, price, status);

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    orderCollection
      .insertOne({ name, email, projectTitle, projectDetails, price, status, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });

  //OrderCard...........................
  app.post("/orderCard", (req, res) => {
    const email = req.body.email;
    orderCollection.find({ email: email }).toArray((error, documents) => {
      res.send(documents);
    });
  });

  //fullOrderList..........................
  app.get("/fullOrderList", (req, res) => {
    orderCollection.find({}).toArray((error, documents) => {
      res.send(documents);
    });
  });

  //addService...........................
  app.post("/addService", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const details = req.body.details;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    // console.log(file, title, details);
    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    serviceCollection.insertOne({ title, details, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
    });
  });

  //service..........................
  app.get("/services", (req, res) => {
    serviceCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
    });
  });

  //addAdmin...........................
  app.post("/addAdmin", (req, res) => {
    const admin = req.body;
    // console.log(review);
    adminCollection.insertOne(admin)
    .then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //admin..........................
  app.get("/admin", (req, res) => {
    adminCollection.find({}).
    toArray((error, documents) => {
      res.send(documents);
    });
  });
  
  //isAdmin...........................
  app.post("/isAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email })
    .toArray((error, admin) => {
      res.send(admin.length > 0);
    });
  });

});
app.listen(process.env.PORT || port);