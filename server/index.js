import express from 'express';
import mongoose from 'mongoose';
// import serverless from 'serverless-http';
import dotenv from 'dotenv';
import cors from 'cors';
import userRouter from './routes/userRoutes.js';
import groupRouter from './routes/groupRoutes.js';
// import postRouter from './routes/postRoutes.js';
// import articleRouter from './routes/articleRoutes.js';
// import emailRouter from './routes/nodemailerRouter.js';
// import presignedUrlRouter from './routes/presignedUrlRoutes.js';
// import announcementRouter from './routes/announcementRoutes.js';
// import feedbackRouter from './routes/feedbackRoutes.js';
// import reportRouter from './routes/reportRoutes.js';
// import formRouter from './routes/formRoutes.js';
// import formSubmissionRouter from './routes/formSubmissionRoutes.js';

dotenv.config();

const app = express();

const corsOptions = {
  
  origin: [
    'http://localhost:3000',  //Your frontend URL
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,  // Allow credentials (cookies, authorization headers)
};

// Enable CORS with the options
app.use(cors(corsOptions));

// Parse cookies if needed (but since you don't use session, this might be optional)
// app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Custom CORS preflight handler (important for Lambda)
app.options('*', cors(corsOptions)); // Preflight request handling

// Routes
app.use('/', userRouter);
app.use('/', groupRouter);
// app.use('/', articleRouter);
// app.use('/', postRouter);
// app.use('/', emailRouter);
// app.use('/', announcementRouter);
// app.use('/', reportRouter);
// app.use('/', formRouter);
// app.use('/', feedbackRouter);
// app.use('/', presignedUrlRouter);
// app.use('/', formSubmissionRouter);

const PORT = process.env.PORT || 3002;
app.get('/hello', (req, res) => { res.send('Hello') });

// Start MongoDB connection
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('connected to database');
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to database: ', error);
    process.exit(1);
  }
};

startServer();

// Export the Lambda handler
// export const handler = serverless(app);