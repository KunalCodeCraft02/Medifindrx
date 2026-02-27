const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    dob:{
        type:Date,
        required:true
    },
    bloodgroup:{
        type:String,
        required:true   
    },
    phonenumber:{
        type:Number,
        required:true

    },
    password:{
        type:String,
        required:true
    }
});


const user = mongoose.model("users",userSchema);
module.exports = user;

