const express = require("express");
const router = express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
// const upload = require("./middleware/cloudinaryStorage");
const Hospital = require("../models/hospital"); // your schema
const Pharmacy = require("../models/pharmacy");
// const Order = require("./models/order");



const usersignin = async (req, res) => {
    const { name, email, dob, password, bloodgroup, phonenumber, confirmpassword } = req.body;

    try {
        if (!email || !phonenumber || !name || !password || !dob || !bloodgroup || !confirmpassword) {
            return res.send(`<script>
                alert("All fields are mandatory!");
                window.location.href="/signin";
            </script>`);
        }

        if (password !== confirmpassword) {
            return res.send(`<script>
                alert("Passwords do not match!");
                window.location.href="/signin";
            </script>`);
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.send(`<script>
                alert("User already exists!");
                window.location.href="/signin";
            </script>`);
        }

        const newUser = await User.create({
            name,
            email,
            dob,
            bloodgroup,
            phonenumber,
            password
        });

        console.log("New User Created:", newUser);

        let token = jwt.sign({ email: email, userid: newUser._id }, "thenameiskunalkailasbodkhe", { expiresIn: "1h" });

        res.cookie("token", token);
        res.redirect("/home");

    } catch (err) {
        console.log("ERROR:", err);
        return res.send(`<script>
            alert("Signin failed!");
            window.location.href="/signin";
        </script>`);
    }
};


const userlogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.send(`<script>
                alert("All fields are mandatory!");
                window.location.href="/login";
            </script>`);
        }
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.send(`<script>
                alert("User does not exist!");
                window.location.href="/login";
            </script>`);
        }
        if (existingUser.password !== password) {
            return res.send(`<script>
                alert("Incorrect password!");
                window.location.href="/login";
            </script>`);
        }
        let token = jwt.sign({ email: email, userid: existingUser._id }, "thenameiskunalkailasbodkhe", { expiresIn: "7h" });
        res.cookie("token", token);
        res.redirect("/home");
    } catch (e) {
        console.error("Login error:", e);
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Error</title>
            </head>
            <body>
                <script>
                    alert("Internal server error");
                    window.location.href = "/login";
                </script>
            </body>
            </html>
        `);
    }
}

const hospitalsignin = async (req, res) => {

    try {

        const {
            name, specilization, email, address, phonenumber, password,
            lat, lng, icuPrice, generalPrice, specialPrice
        } = req.body;

        // check duplicate email
        const exist = await Hospital.findOne({ email });
        if (exist) {
            return res.send(`<script>
        alert("Hospital already registered with this email");
        window.location="/hospitalsignin";
        </script>`);
        }

        // check files
        if (!req.files || !req.files["licensephoto"] || !req.files["hospitalimage"]) {
            return res.send(`<script>
        alert("Upload license & hospital image");
        window.location="/hospitalsignin";
        </script>`);
        }

        const licensephoto = req.files["licensephoto"][0].path || req.files["licensephoto"][0].secure_url;
        const hospitalimage = req.files["hospitalimage"][0].path || req.files["hospitalimage"][0].secure_url;

        // convert location safely
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.send(`<script>
        alert("Click GET CURRENT LOCATION before signup");
        window.location="/hospitalsignin";
        </script>`);
        }

        // save hospital
        await Hospital.create({
            name,
            specilization,
            email,
            address,
            phonenumber,
            password,

            lat: latitude,
            lng: longitude,

            icuPrice,
            generalPrice,
            specialPrice,

            licensephoto,
            hospitalimage
        });

        res.send(`<script>
    alert("Hospital request sent to admin for approval");
    window.location="/";
    </script>`);

    } catch (err) {
        console.log("HOSPITAL SIGNUP ERROR:", err);
        res.send("Server error");
    }


};



const adminlogin = (req, res) => {
    const { email, password } = req.body;

    if (email === "admin@gmail.com" && password === "admin123") {
        res.redirect("/admin");
    } else {
        res.send("Wrong admin");
    }


}








const hospitallogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const hospital = await Hospital.findOne({ email });

        if (!hospital) {
            return res.send(`<script>
            alert("Hospital not found");
            window.location="/hospitallogin";
            </script>`);
        }

        if (hospital.status === "pending") {
            return res.send(`<script>
            alert("Wait for admin approval");
            window.location="/hospitallogin";
            </script>`);
        }

        if (hospital.status === "rejected") {
            return res.send(`<script>
            alert("Admin rejected your request");
            window.location="/hospitallogin";
            </script>`);
        }

        if (hospital.password !== password) {
            return res.send(`<script>
            alert("Wrong password");
            window.location="/hospitallogin";
            </script>`);
        }

        //  CREATE TOKEN
        const token = jwt.sign(
            { id: hospital._id, role: "hospital" },
            "thenameiskunalhospital",
            { expiresIn: "1d" }
        );

        // SAVE COOKIE
        res.cookie("token", token, { httpOnly: true });

        //  IMPORTANT: ONLY ONE RESPONSE
        return res.redirect("/hospitaladmin");

    } catch (err) {
        console.log(err);
        return res.send("Login error");
    }
};





const pharmacysignin = async (req, res) => {
  try {

    const { name, email, address, phonenumber, password, lat, lng } = req.body;

   
    const existing = await Pharmacy.findOne({ email });

    if (existing) {
      return res.send(`<script>
      alert("Pharmacy already registered with this email");
      window.location="/pharmacysignin";
      </script>`);
    }

    // check files
    if (!req.files || !req.files["licensephoto"] || !req.files["shopimage"]) {
      return res.send(`<script>
      alert("Upload license and shop image");
      window.location="/pharmacysignin";
      </script>`);
    }

    const licensephoto = req.files["licensephoto"][0].path;
    const shopimage = req.files["shopimage"][0].path;

    await Pharmacy.create({
      name,
      email,
      address,
      phonenumber,
      password,
      licensephoto,
      shopimage,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      status: "pending"
    });

    res.send(`<script>
    alert("Pharmacy request sent to admin");
    window.location="/";
    </script>`);

  } catch (err) {
    console.log("PHARMACY SIGNUP ERROR:", err);
    res.send("Signup error");
  }
};






const pharmacylogin = async (req, res) => {
    try {

        const { email, password } = req.body;

        const pharmacy = await Pharmacy.findOne({ email });

        if (!pharmacy) {
            return res.send(`<script>
                alert("Pharmacy not found");
                window.location="/pharmacylogin";
            </script>`);
        }

        if (pharmacy.password !== password) {
            return res.send(`<script>
                alert("Wrong password");
                window.location="/pharmacylogin";
            </script>`);
        }

        if (pharmacy.status !== "approved") {
            return res.send(`<script>
                alert("Wait for admin approval");
                window.location="/pharmacylogin";
            </script>`);
        }

        // CREATE JWT TOKEN WITH PHARMACY ID
        const token = jwt.sign(
            {
                pharmacyId: pharmacy._id,
                role: "pharmacy"
            },
            process.env.PHARMACY_SECRET || "thekunalforpharmacy",
            { expiresIn: "7d" }
        );

        // SET COOKIE
        res.cookie("pharmacytoken", token, {
            httpOnly: true,
            secure: false, // set true when using https only
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log("Pharmacy login success:", pharmacy.email);

        return res.redirect("/pharmacyadmin");

    } catch (err) {
        console.log("Pharmacy login error:", err);
        res.send("Login error");
    }
};






















const logout = async (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
}



















module.exports = { router, usersignin, logout, userlogin, hospitalsignin, adminlogin, hospitallogin, pharmacysignin, pharmacylogin };