const mongoose = require("mongoose");

const bedBookingSchema = new mongoose.Schema({
hospitalId:{
 type:String
},
  hospitalName:String,
  userEmail:String,
  userName:String,
  bedType:String,

  status:{
    type:String,
    default:"pending"
  },

  otp:String,

  completed:{
    type:Boolean,
    default:false
  }

},{timestamps:true});

module.exports = mongoose.model("BedBooking", bedBookingSchema);