const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs-extra')
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const querystring = require('querystring');
require('dotenv').config();

// creative agency server functionality.............
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('service'))
app.use(fileUpload({
  createParentPath: true
}));

app.get('/', (req, res) => {
    res.send('Creative Agency Database in Connected')
})

const port = 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g7kps.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// service collection
client.connect(err => {
  const serviceCollection = client.db(process.env.DB_NAME).collection(process.env.DB_SERVICE);
  
  // getService..........................
  app.get('/getServices', (req, res) => {
    serviceCollection.find({})
    .toArray( (err, documents) => {
        res.send(documents)
    })
  })

  // service.............................
  app.get('/service/:id', (req, res) => {
    serviceCollection.find({_id: ObjectId(req.params.id)})
    .toArray( (err, documents) => {
        res.send(documents[0])
      })
    })

  // addService..........................
  app.post('/addService', (req, res) => {
    const image = req.files.image;
    const title = req.body.title;
    const description = req.body.description;
    const filePath = `${__dirname}/service/${image.name}`
    image.mv(filePath, err => {
      if(err){
        console.log(err)
        res.status(500).send({msg: 'Failed to save image in mongodb'})
      }
      const newImage = fs.readFileSync(filePath)
      const encImage = newImage.toString('base64')

      var image = {
        contentType: req.files.image.mimetype,
        size: req.files.image.size,
        img: Buffer.from(encImage, 'base64')
      }

      serviceCollection.insertOne({title, description, image})
      .then(result => {
        fs.remove(filePath, error => {
          if(error){
            console.log(error)
          }
          res.send(result.insertedCount > 0)
        })
      })
    })
    console.log(title, description, image)
  })
});

// reviews.............
client.connect(err => {
  const reviewsCollection = client.db(process.env.DB_NAME).collection(process.env.DB_REVIEWS);
  
  // getReviews.........................
  app.get('/getReviews', (req, res) => {
    reviewsCollection.find({})
    .toArray( (err, documents) => {
        res.send(documents)
    })
  })

  // addReview..........................
  app.post('/addReview', (req, res) => {
    const data = req.body
    reviewsCollection.insertOne(data)
    .then(result => {
      res.send(result)
    })
    .catch(err => console.log(err))
  })
});

// order...............
client.connect(err => {
  const orderCollection = client.db(process.env.DB_NAME).collection(process.env.DB_ORDER);
  
  // addOrder..........................
  app.post('/addOrder', (req, res) => {
    const data = req.body
    orderCollection.insertOne(data)
    .then(result => {
      res.send(result)
    })
    .catch(err => console.log(err))
  })

  // getUserOrder..........................
  app.get('/getUserOrder/', (req, res) => {
    orderCollection.find({email: req.query.email})
    .toArray( (err, documents) => {
      res.send(documents)
    } )
  })

  // getAllOrderedService............................
  app.get('/getAllOrderedService', (req, res) => {
    orderCollection.find({})
    .toArray( (err, documents) => {
        res.send(documents)
    })
  })

  //update status............................
  app.patch('/status-update/id',(req, res)=>{
    const id = req.query.id;
    const body = req.body;
    const {status} = body;
    orderCollection.updateOne(
        { _id: ObjectId(id) },
        {
          $set: { status: status},
        }
    )
    .then(result => res.send(result.modifiedCount))
  })
});

// admin...............
client.connect(err => {
  const adminCollection = client.db(process.env.DB_NAME).collection(process.env.DB_ADMIN);
  
  // getAdmin..........................
  app.get('/getAdmin/', (req, res) => {
    adminCollection.find({email: req.query.email})
    .toArray( (err, documents) => {
      if(documents.length > 0){
        res.send(true)
      }
      else{
        res.send(false)
      }
    } )
  })

  // addAdmin..........................
  app.post('/addAdmin', (req, res) => {
    const email = req.body
    adminCollection.insertOne(email)
    .then(result => {
      res.send(result)
    })
    .catch(err => console.log(err))
  })
});

app.listen(process.env.PORT || port)