const jwt = require("jsonwebtoken");
const Pharmacy = require("../models/pharmacy");

const pharmacyAuth = async (req,res,next)=>{
    try{
        const token = req.cookies.pharmacytoken;

        if(!token){
            return res.redirect("/pharmacylogin");
        }

        // 🔥 SAME SECRET AS LOGIN
        const decoded = jwt.verify(token,"thekunalforpharmacy");

        if(decoded.role !== "pharmacy"){
            return res.send("Access denied");
        }

        const pharmacy = await Pharmacy.findById(decoded.id);

        if(!pharmacy){
            return res.redirect("/pharmacylogin");
        }

        req.pharmacy = pharmacy;
        next();

    }catch(err){
        console.log("PHARMACY AUTH ERROR:",err.message);
        res.redirect("/pharmacylogin");
    }
};

module.exports = pharmacyAuth;