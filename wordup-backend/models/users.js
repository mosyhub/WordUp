import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" }, // Roles
    userType: {
      type: String,
      enum: ["student", "professional", "broadcaster", "teacher", "other"],
      default: "other",
    },
    usageContext: {
      type: String,
      enum: ["educational", "practice", "professional", "personal", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
