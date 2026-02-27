const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
doctorId:String,
doctorName:String,

userName:String,
userEmail:String,
problem:String,
date:String,
time:String,

status:{type:String,default:"pending"},
otp:String,
completed:{type:Boolean,default:false}

},{timestamps:true});

module.exports = mongoose.model("Appointment",appointmentSchema);