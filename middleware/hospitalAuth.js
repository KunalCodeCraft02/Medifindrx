const jwt = require("jsonwebtoken");
const Hospital = require("../models/hospital");

const hospitalAuth = async (req,res,next)=>{
    try{
        const token = req.cookies.token;

        if(!token) return res.redirect("/hospitallogin");

        const decoded = jwt.verify(token,"thenameiskunalhospital");

        if(decoded.role !== "hospital"){
            return res.send("Access denied");
        }

        const hospital = await Hospital.findById(decoded.id);
        if(!hospital) return res.redirect("/hospitallogin");

        req.hospital = hospital;
        next();

    }catch(err){
        console.log(err);
        res.redirect("/hospitallogin");
    }
};

module.exports = hospitalAuth;