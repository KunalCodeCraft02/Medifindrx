const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({

    name: { type: String, required: true },
    specilization:{ type:String, required:true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    licensephoto: { type: String, required: true },
    hospitalimage: { type: String, required: true },
    phonenumber: { type: String, required: true },
    password: { type: String, required: true },

   
    lat: { type: Number },
    lng: { type: Number },


    icuPrice: { type: Number },
    generalPrice: { type: Number },
    specialPrice: { type: Number },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }

}, { timestamps: true });

module.exports = mongoose.model("Hospital", hospitalSchema);