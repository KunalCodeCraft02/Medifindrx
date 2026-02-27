const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    
    name: String,
    email: String,
    password: String,

    specialization: String,
    degree: String,
    experience: String,
    fees: String,

    workingAt: String,
    workingTime: String,

    degreePhoto: String,
    profilePhoto: String,

    status: {
        type: String,
        default: "pending"   // pending → admin approve
    }

}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);