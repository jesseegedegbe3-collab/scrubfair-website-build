import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Sweep expired temp holds + expired owner-response windows every 15 minutes.
crons.interval(
  "sweep-expired-holds",
  { minutes: 15 },
  internal.bookingsAdmin.sweepExpiredHolds,
  {},
);

// 48-hour reminder sweep: hourly; finds confirmed bookings starting in ~48h
// that haven't had a reminder sent. Implemented in bookingsAdmin.sweepReminders.
crons.interval(
  "sweep-reminders",
  { minutes: 60 },
  internal.bookingsAdmin.sweepReminders,
  {},
);

export default crons;
