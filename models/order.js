const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  pharmacyId: String,
  shopname: String,
  username: String,
  phone: String,
  medicine: String,
  quantity: Number,
  useremail: String,
  mode: String,
  prescription: String,
  status: String,
  otp: String,
  createdAt: Date
});

module.exports = mongoose.model("Order", orderSchema);
