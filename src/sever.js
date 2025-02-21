import express from 'express';
import { connect } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index.js'; // Import main router
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const URI_DB = process.env.URI_DB;
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

// parse application/json
app.use(
  bodyParser.json({
    extended: true,
    limit: "50mb",
  })
);

// app.use(cors());
app.use(
  cors({
    origin: ["http://127.0.0.1:5173", "http://localhost:5173", "https://fsneaker.id.vn"], // Frontend's origin
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies to be sent with requests
  })
);
connect(URI_DB)
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.log('Error connecting to the database', err);
  });
app.use(express.json());

connect(URI_DB)
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.log('Error connecting to the database', err);
  });

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});