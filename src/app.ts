import express from 'express';
import path from 'path';
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
import clubRoutes from './routes/club.routes';
import userRoutes from './routes/user.routes';
import deviceRoutes from './routes/device.routes';
import permissionRoutes from './routes/permission.routes';
import trainingRoutes from './routes/training.routes';
import crmRoutes from './routes/crm.routes';
import locationRoutes from './routes/location.routes';
import staffRoutes from './routes/staff.routes'
import posRoutes from './routes/pos.routes'
import checkinRoutes from './routes/checkin.routes'
import taskRoutes from './routes/task.routes';
import reportRoutes from './routes/report.routes';




dotenv.config();
const app = express();

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
app.use('/api/communication', communicationRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/training-resources', trainingRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/products', posRoutes)
app.use('/api/checkin', checkinRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);



app.get('/', (req, res) => {
  res.send('Gym API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
