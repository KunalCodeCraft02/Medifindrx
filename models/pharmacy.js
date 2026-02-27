const mongoose = require("mongoose");

const pharmacySchema = new mongoose.Schema({
    name:String,
    email:String,
    address:String,
    phonenumber:String,
    password:String,
    licensephoto:String,
    shopimage:String,

    lat:Number,   
    lng:Number,   

   status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
});

module.exports = mongoose.model("Pharmacy", pharmacySchema);




