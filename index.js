const path = require('path')
const express = require('express')

const app = express()
const port = process.env.PORT || 3000

const MongoClient = require('mongodb').MongoClient
const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/dev'
const multer = require('multer')

async function initMongo() {
  console.log('Initialising MongoDB...')
  let success = false

  while (!success) {
    try {
      client = await MongoClient.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })

      success = true

    } catch (e) {
      console.log('Error connecting to MongoDB, retrying in 1 second')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log('MongoDB initialised')

  return client.db(client.s.options.dbName).collection('notes')
}


async function retrieveNotes(db) {
  const notes = (await db.find().toArray()).reverse()
  return notes
}


async function saveNote(db, note) {
  await db.insertOne(note)
}


async function start() {
  const db = await initMongo()

  app.set('view engine', 'pug')
  app.set('views', path.join(__dirname, 'views'))
  app.use(express.static(path.join(__dirname, 'public')))


  app.get('/', async (req, res) => {
    res.render('index', { notes: await retrieveNotes(db) })
  })


  app.post(
    '/note',
    multer().none(),
    async (req, res) => {
      if (!req.body.upload && req.body.description) {
        await saveNote(db, { description: req.body.description })
        res.redirect('/')
      }
    }
  )

  app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`)
  })
}

start()
