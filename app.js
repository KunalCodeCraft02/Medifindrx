const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const mongodb = require("./config/databaseconnection");
const { usersignin, logout, userlogin, hospitalsignin, adminlogin, hospitallogin, pharmacylogin, pharmacysignin } = require("./router/router");
const upload = require("./middleware/cloudinaryStorage");
const Hospital = require("./models/hospital");
const Pharmacy = require("./models/pharmacy");
const Order = require("./models/order");
const middleware = require("./middleware/auth");
// const nodemailer = require("nodemailer")
const pharmacyAuth = require("./middleware/pharmacyAuth");
const User = require("./models/user");
const BedBooking = require("./models/bedBooking");
const hospitalAuth = require("./middleware/hospitalAuth");
const Doctor = require("./models/docotor");
const Appointment = require("./models/appointment");
const doctorAuth = require("./middleware/doctorAuth");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const axios = require("axios");





app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");


// ===== BREVO MAIL FUNCTION (WORKS ON RENDER) =====
async function sendMail(to, subject, html) {
  try {

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "MediFindRx",
          email: "hyperboy022@gmail.com"
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("MAIL SENT SUCCESS:", response.data);

  } catch (err) {
    console.log("MAIL ERROR FULL:", err.response?.data || err.message);
  }
}


app.get("/", (req, res) => {
  res.render("index");
});

app.get("/home", middleware, async (req, res) => {

  const userId = req.user.userid;
  const user = await User.findById(userId);

  res.render("home", { user });
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signinas", (req, res) => {
  res.render("signinas");
});

app.get("/loginas", (req, res) => {
  res.render("loginas");
});
app.get("/pharmacysignin", (req, res) => {
  res.render("pharmacysignin");
});

app.get("/hospitalsignin", (req, res) => {
  res.render("hospitalsignin");
});
app.get("/pharmacylogin", (req, res) => {
  res.render("pharmacylogin");
});

app.get("/hospitallogin", (req, res) => {
  res.render("hospitallogin");
});

app.get("/hospitaladmin", hospitalAuth, async (req, res) => {

  try {

    //  only this hospital requests
    const requests = await BedBooking.find({
      hospitalId: req.hospital._id.toString()
    }).sort({ createdAt: -1 });

    res.render("hospitaladmin", {
      requests: requests,
      hospital: req.hospital
    });

  } catch (err) {
    console.log("HOSPITAL ADMIN ERROR:", err);
    res.send("Hospital panel error");
  }

});

app.get("/superadmin", (req, res) => {
  res.render("adminlogin");
});
app.get("/admin", async (req, res) => {
  try {

    const pendingHospitals = await Hospital.find({ status: "pending" });
    const pendingPharmacies = await Pharmacy.find({ status: "pending" });
    const pendingDoctors = await Doctor.find({ status: "pending" }); // ⭐ add

    res.render("admin", {
      pendingHospitals,
      pendingPharmacies,
      pendingDoctors // ⭐ send to admin panel
    });

  } catch (err) {
    console.log(err);
    res.send("Admin error");
  }
});

app.get("/admin/approve/:id", async (req, res) => {
  await Hospital.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.redirect("/admin");
});

app.get("/admin/reject/:id", async (req, res) => {
  await Hospital.findByIdAndUpdate(req.params.id, { status: "rejected" });
  res.redirect("/admin");
});









app.post("/adminlogin", adminlogin)
app.post("/signin", usersignin);
app.post("/login", userlogin);
app.post("/hospitalsignin",
  upload.fields([
    { name: "licensephoto", maxCount: 1 },
    { name: "hospitalimage", maxCount: 1 }
  ]),
  hospitalsignin);

app.post("/hospitallogin", hospitallogin);
app.post("/pharmacysignin",
  upload.fields([
    { name: "licensephoto", maxCount: 1 },
    { name: "shopimage", maxCount: 1 }
  ]),
  pharmacysignin);


app.get("/admin/pharmacy", async (req, res) => {
  const pendingPharmacy = await Pharmacy.find({ status: "pending" });
  res.render("adminpharmacy", { pendingPharmacy });
});

app.get("/admin/pharmacy/approve/:id", async (req, res) => {
  await Pharmacy.findByIdAndUpdate(req.params.id, { status: "approved" });
  res.redirect("/admin");
});

app.get("/admin/pharmacy/reject/:id", async (req, res) => {
  await Pharmacy.findByIdAndUpdate(req.params.id, { status: "rejected" });
  res.redirect("/admin");
});


app.post("/pharmacylogin", pharmacylogin);

app.get("/pickup", middleware, (req, res) => {
  const shop = req.query.shop;
  const mode = req.query.mode;

  res.render("pickup", { shop, mode });
});

app.get("/pharmacyadmin", async (req, res) => {

  try {

    const token = req.cookies.pharmacytoken;

    if (!token) {
      return res.redirect("/pharmacylogin");
    }

    const decoded = jwt.verify(
      token,
      process.env.PHARMACY_SECRET || "thekunalforpharmacy"
    );

    // ONLY FETCH ORDERS OF THIS PHARMACY
    const orders = await Order.find({
      pharmacyId: decoded.pharmacyId
    }).sort({ createdAt: -1 });

    res.render("pharmacyadmin", { orders });

  } catch (err) {
    console.log("Admin panel error:", err);
    res.redirect("/pharmacylogin");
  }
});


app.get("/order/approve/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.send("Order not found");

    // ⭐ MAKE OTP STRING
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    order.status = "approved";
    order.otp = otp;

    await order.save();

    console.log("OTP SAVED IN DB:", otp);   // DEBUG

    sendMail(
      booking.userEmail,
      "Bed Confirmed",
      `<h2>Bed Confirmed</h2>
   <p>Hospital: ${booking.hospitalName}</p>
   <h3>OTP: ${otp}</h3>`
    );

    res.redirect("/pharmacyadmin");

  } catch (err) {
    console.log(err);
    res.send("Approve error");
  }
});

app.get("/order/reject/:id", async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, { status: "rejected" });
  res.redirect("/pharmacyadmin");
});




// app.post("/pickuporder", upload.single("prescription"), async (req, res) => {

//   console.log("pickuporder route hit");
//   console.log(req.body);

//   const { shopname, medicine, quantity, useremail, mode } = req.body;
//   const prescription = req.file ? req.file.path : null;

//   // find pharmacy
//   const pharmacy = await Pharmacy.findOne({ name: shopname });

//   console.log("FOUND PHARMACY:");
//   console.log(pharmacy);

//   if (!pharmacy) {
//     return res.send("Pharmacy not found");
//   }

//   // create order
//   const order = await Order.create({
//     shopname,
//     medicine,
//     quantity,
//     useremail,
//     mode,
//     prescription,
//     status: "pending",
//     createdAt: new Date()
//   });

//   // redirect to waiting page WITH LAT LNG
//   res.render("waiting", {
//     orderId: order._id,
//     lat: pharmacy.lat,
//     lng: pharmacy.lng
//   });

// });

app.post("/pickuporder", (req, res) => {

  upload.single("prescription")(req, res, async function (err) {

    if (err) {
      return res.send("File upload error: " + err.message);
    }

    try {

      const { shopname, medicine, quantity, useremail, mode, username, phone } = req.body;

      const pharmacy = await Pharmacy.findOne({ name: shopname });

      if (!pharmacy) {
        return res.send("Pharmacy not found");
      }

      let prescription = null;
      if (req.file) {
        prescription = req.file.path;
      }

      const order = await Order.create({
        pharmacyId: pharmacy._id,
        shopname: pharmacy.name,
        username,
        phone,
        medicine,
        quantity,
        useremail,
        mode,
        prescription,
        status: "pending",
        createdAt: new Date()
      });

      res.render("waiting", {
        orderId: order._id.toString(),
        lat: pharmacy.lat.toString(),
        lng: pharmacy.lng.toString()
      });

    } catch (error) {
      res.send("Server error");
    }

  });

});

app.get("/waiting/:id", async (req, res) => {

  const order = await Order.findById(req.params.id);
  console.log(" waiting route hit");
  res.render("waiting", {
    orderId: order._id,
    lat: order.lat,
    lng: order.lng
  });

});

app.get("/check-status/:id", async (req, res) => {

  const order = await Order.findById(req.params.id);
  if (!order) return res.json({ status: "none" });

  const now = new Date();
  const diff = (now - order.createdAt) / 1000;

  // if not responded in 90 sec
  if (order.status === "pending" && diff > 90) {
    order.status = "timeout";
    await order.save();
  }

  res.json({
    status: order.status,
    shop: order.shopname
  });
});

app.get("/my-orders/:email", async (req, res) => {
  const orders = await Order.find({ useremail: req.params.email });
  res.json(orders);
});



app.post("/verifyotp", async (req, res) => {

  const { orderid, otp } = req.body;

  const order = await Order.findById(orderid);

  if (!order) return res.send("Order not found");

  console.log("ENTERED OTP:", otp);
  console.log("DATABASE OTP:", order.otp);

  //  STRING COMPARE
  if (otp.toString() === order.otp.toString()) {

    order.status = "completed";
    await order.save();

    res.send(`<script>
      alert("OTP Verified Medicine Delivered");
      window.location="/pharmacyadmin";
    </script>`);

  } else {

    res.send(`<script>
      alert("Wrong OTP ");
      window.location="/pharmacyadmin";
    </script>`);
  }

});

app.get("/get-pharmacy", async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({ status: "approved" });
    res.json(pharmacies);
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});





// hospital section 


app.get("/showhospital", middleware, (req, res) => {
  res.render("showhospital");
});

app.get("/get-hospitals", async (req, res) => {
  const hospitals = await Hospital.find({ status: "approved" });
  res.json(hospitals);
});


app.get("/bookbed", middleware, (req, res) => {
  const hospital = req.query.hospital;
  res.render("bookbed", { hospital });
});

app.post("/bookbed", async (req, res) => {

  const { hospitalName, userEmail, userName, bedType } = req.body;

  const hospital = await Hospital.findOne({ name: hospitalName });

  if (!hospital) {
    return res.send("Hospital not found");
  }

  await BedBooking.create({
    hospitalName,
    hospitalId: hospital._id.toString(),
    userEmail,
    userName,
    bedType,
    status: "pending"
  });

  res.send(`<script>
alert("Request sent to hospital");
window.location="/home";
</script>`);

});

app.get("/bed/approve/:id", async (req, res) => {

  const booking = await BedBooking.findById(req.params.id);

  const otp = Math.floor(1000 + Math.random() * 9000);

  booking.status = "approved";
  booking.otp = otp;
  await booking.save();

  console.log("APPROVED FOR:", booking.userEmail);




 sendMail(
  booking.userEmail,
  "Bed Confirmed",
  `<h2>Bed Confirmed</h2>
   <p>Hospital: ${booking.hospitalName}</p>
   <h3>OTP: ${otp}</h3>`
);

  res.redirect("/hospitaladmin");
});


app.get("/bed/reject/:id", async (req, res) => {

  await BedBooking.findByIdAndUpdate(req.params.id, {
    status: "rejected"
  });

  res.redirect("/hospitaladmin");
});








app.post("/verify-bed-otp", async (req, res) => {

  const { bookingId, otp } = req.body;

  const booking = await BedBooking.findById(bookingId);

  if (!booking) {
    return res.send("Booking not found");
  }

  if (booking.otp === otp) {

    booking.completed = true;
    await booking.save();

    res.send(`
      <script>
      alert("OTP verified. Bed given to patient");
      window.location="/hospitaladmin";
      </script>
      `);

  } else {
    res.send(`
      <script>
      alert("Wrong OTP");
      window.location="/hospitaladmin";
      </script>
      `);
  }
});

app.get("/docotorsignin", (req, res) => {
  res.render("docotorsignin")
})

app.get("/admin/doctors", async (req, res) => {
  try {

    const doctors = await Doctor.find({ status: "pending" });

    res.render("admindoctor", { doctors });

  } catch (err) {
    console.log(err);
    res.send("Doctor admin error");
  }
});


app.post("/doctorsignin", upload.single("degreePhoto"), async (req, res) => {
  try {

    const { name, email, password, specialization, degree, experience, fees, workingAt, workingTime, lat, lng } = req.body;

    const degreePhoto = req.file.path;

    const exist = await Doctor.findOne({ email });
    if (exist) {
      return res.send("Doctor already exists");
    }

    await Doctor.create({
      name, email, password, specialization, degree, experience,
      workingAt, workingTime,
      degreePhoto, fees,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });

    res.send(`<script>
alert("Doctor registered. Wait for admin approval");
window.location="/";
</script>`);

  } catch (err) {
    console.log(err);
    res.send("Error");
  }

});

app.get("/get-doctors", async (req, res) => {
  const doctors = await Doctor.find({ status: "approved" });
  res.json(doctors);
});

app.get("/showdoctors", middleware, (req, res) => {
  res.render("showdoctors");
});



app.get("/book-appointment/:id", async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  res.render("bookappointment", { doctor });
});

app.post("/book-appointment", async (req, res) => {

  const { doctorId, doctorName, userName, userEmail, problem, date, time } = req.body;

  await Appointment.create({
    doctorId,
    doctorName,
    userName,
    userEmail,
    problem,
    date,
    time,
    status: "pending"
  });

  res.send(`<script>
  alert("Appointment sent to doctor");
  window.location="/home";
  </script>`);
});



app.get("/admindoctor", doctorAuth, async (req, res) => {

  const appointments = await Appointment.find({
    doctorId: req.doctor._id.toString()
  }).sort({ createdAt: -1 });

  res.render("admindoctor", {
    appointments,
    doctor: req.doctor
  });
});

app.get("/doctor/approve/:id", async (req, res) => {
  try {

    console.log("Doctor approve clicked:", req.params.id);

    const ap = await Appointment.findById(req.params.id);
    if (!ap) return res.send("Appointment not found");

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    ap.status = "approved";
    ap.otp = otp;
    await ap.save();

    console.log("OTP SAVED:", otp);

    sendMail(
      ap.userEmail,
      "Appointment Confirmed",
      `<h2>Appointment Confirmed</h2>
   <p>Doctor: ${ap.doctorName}</p>
   <h3>Your OTP: ${otp}</h3>`
    );

    //  REDIRECT INSTANT (DON'T WAIT FOR MAIL)
    res.redirect("/admindoctor");

  } catch (err) {
    console.log("DOCTOR APPROVE ERROR:", err);
    res.send("Approve error");
  }
});


app.post("/verify-doctor-otp", async (req, res) => {

  const { id, otp } = req.body;

  const ap = await Appointment.findById(id);

  if (ap.otp == otp) {
    ap.completed = true;
    await ap.save();
    res.send("Appointment completed");
  } else {
    res.send("Wrong OTP");
  }
});


app.get("/doctorlogin", (req, res) => {
  res.render("doctorlogin");
});

// ===== ADMIN APPROVE DOCTOR =====
app.get("/admin/doctor/approve/:id", async (req, res) => {
  try {

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.send("Doctor not found");
    }

    doctor.status = "approved";
    await doctor.save();

    res.redirect("/admin"); // admin panel redirect

  } catch (err) {
    console.log("DOCTOR APPROVE ERROR:", err);
    res.send("Error approving doctor");
  }
});

// ===== ADMIN REJECT DOCTOR =====
app.get("/admin/doctor/reject/:id", async (req, res) => {
  try {

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.send("Doctor not found");
    }

    doctor.status = "rejected";
    await doctor.save();

    res.redirect("/admin");

  } catch (err) {
    console.log(err);
    res.send("Reject error");
  }
});




app.post("/doctorlogin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.send(`<script>
      alert("Doctor not found");
      window.location="/doctorlogin";
      </script>`);
    }

    // check approved
    if (doctor.status !== "approved") {
      return res.send(`<script>
      alert("Wait for admin approval");
      window.location="/doctorlogin";
      </script>`);
    }

    // check password
    if (doctor.password !== password) {
      return res.send(`<script>
      alert("Wrong password");
      window.location="/doctorlogin";
      </script>`);
    }

    // create token
    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      "doctorkunal",
      { expiresIn: "1d" }
    );

    res.cookie("doctortoken", token);

    // redirect
    res.redirect("/admindoctor");

  } catch (err) {
    console.log(err);
    res.send("Doctor login error");
  }
});

app.get("/doctorlogout", (req, res) => {
  res.clearCookie("doctortoken");
  res.redirect("/doctorlogin");
});

app.get("/logout", logout);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});
