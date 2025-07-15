import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import memberRoutes from './routes/member.routes';
import trainerRoutes from './routes/trainer.routes';
import plan from './routes/plan.routes';
import billingRoutes from './routes/billing.routes';
import scheduleRoutes from './routes/schedule.routes';
import classRoutes from './routes/class.routes';
import bookingRoutes from './routes/booking.routes';
import attendanceRoutes from './routes/attendance.routes';
import communicationRoutes from './routes/communication.routes';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/auth',authRoutes)
app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/plans', plan);
app.use('/api/billing', billingRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/communications', communicationRoutes);

app.get('/', (req, res) => {
  res.send('Gym API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
