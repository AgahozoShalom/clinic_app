const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');
const { authenticate } = require('./middlewares/authenticate');

// Import routes
const authRoutes = require('./routes/auth.routes');
const studentsRoutes = require('./routes/students.routes');
const casesRoutes = require('./routes/cases.routes');
const findingsRoutes = require('./routes/findings.routes');
const labTestsRoutes = require('./routes/labTests.routes');
const labTestsRootRoutes = require('./routes/labTestsRoot.routes');
const medicationsRoutes = require('./routes/medications.routes');
const transfersRoutes = require('./routes/transfers.routes');
const transfersRootRoutes = require('./routes/transfersRoot.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

// Middlewares
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);

// Protect all routes below with authentication
apiRouter.use(authenticate);

apiRouter.use('/students', studentsRoutes);
apiRouter.use('/cases', casesRoutes);
apiRouter.use('/cases/:id/findings', findingsRoutes);
apiRouter.use('/cases/:id/lab-tests', labTestsRoutes);
apiRouter.use('/cases/:id/medications', medicationsRoutes);
apiRouter.use('/cases/:id/transfer', transfersRoutes);

apiRouter.use('/lab-tests', labTestsRootRoutes);
apiRouter.use('/transfers', transfersRootRoutes);
apiRouter.use('/users', usersRoutes);

app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
