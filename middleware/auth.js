const jwt = require("jsonwebtoken");

const authmiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.send(`
            <script>
                alert("You must login first");
                window.location.href = "/login";
            </script>
        `);
    }

    try {
        const data = jwt.verify(token, "thenameiskunalkailasbodkhe");
        req.user = data;
        next();   // VERY IMPORTANT
    } 
    catch (e) {
        return res.send(`
            <script>
                alert("Please login or Signup to continue");
                window.location.href = "/login";
            </script>
        `);
    }
};

module.exports = authmiddleware;
