const jwt = require("jsonwebtoken");
const Doctor = require("../models/docotor");

const doctorAuth = async(req,res,next)=>{
try{

const token = req.cookies.doctortoken;

if(!token){
return res.redirect("/doctorlogin");
}

const decoded = jwt.verify(token,"doctorkunal");

if(decoded.role !== "doctor"){
return res.send("Access denied");
}

const doctor = await Doctor.findById(decoded.id);
if(!doctor){
return res.redirect("/doctorlogin");
}

req.doctor = doctor;
next();

}catch(err){
console.log("Doctor auth error:",err.message);
res.redirect("/doctorlogin");
}
};

module.exports = doctorAuth;