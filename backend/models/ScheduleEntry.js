const mongoose = require("mongoose");

const scheduleEntrySchema = new mongoose.Schema({
  desktop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Desktop",
    required: true,
  },
  date: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  student_id: { type: String, default: null },
  name: { type: String, default: null },
  mark: { type: String, default: null },
  library_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Library",
    default: null,
  },
});

module.exports = mongoose.model("ScheduleEntry", scheduleEntrySchema);
