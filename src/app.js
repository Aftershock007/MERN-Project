require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const hbs = require("hbs");
const path = require("path");

require("./db/conn");
const Register = require("./models/registers");
const auth = require("./middleware/auth");
const {
    read
} = require("fs");

const port = process.env.PORT || 8000;

//OPTIMIZE: All Middlewares list 
app.use(express.json()); //TODO: When we add data from postman then we need to add this 
app.use(cookieParser());
app.use(express.urlencoded({
    extended: false
})); //TODO: When we add data from browser form then we need to add this 

const static_path = path.join(__dirname, "../public");
app.use(express.static(static_path)); //TODO: This is for attach the CSS file to hbs 

const templates_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.set("view engine", "hbs");
app.set("views", templates_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
    res.render("index");
});
app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/register", (req, res) => {
    res.render("register");
});
app.get("/secret", auth, (req, res) => {
    res.render("secret");
});
app.get("/logout", auth, async (req, res) => {
    try {
        // TODO: Remove token from DB (Logout from only recent devices) 
        req.user.tokens = req.user.tokens.filter((currElement) => {
            return currElement.token !== req.token;
        });

        // TODO: Remove token from DB (Logout from all devices) 
        req.user.tokens = [];

        // TODO: Remove the cookie from the website 
        res.clearCookie("jwt");

        await req.user.save();
        res.render("login");
    } catch (err) {
        res.status(500).send(err);
    }
});

//TODO: Registration Check 
app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;
        if (password === cpassword) {
            const registerEmployee = new Register({
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                gender: req.body.gender,
                phone: req.body.phone,
                age: req.body.age,
                password: req.body.password,
                confirmpassword: req.body.confirmpassword
            });

            // OPTIMIZE: Password Hash (It's a middleware) 
            // Here the pre method occurs that is in registers.js

            // OPTIMIZE: Generate Token in registration 
            const token = await registerEmployee.generateAuthToken();

            //OPTIMIZE: The res.cookie() function is used to set the cookie name to value 
            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 60000),
                httpOnly: true,
                // secure: true
            });

            const registered = await registerEmployee.save();
            res.status(201).render("index");
        } else {
            res.send("Password are not matching");
        }
    } catch (err) {
        res.status(400).send(err);
    }
});

//TODO: Login Check 
app.post("/login", async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        //OPTIMIZE: Password in DataBase 
        const useremail = await Register.findOne({
            email: email
        });
        const isMatch = await bcrypt.compare(password, useremail.password);

        //TODO: Generate Token in login 
        const token = await useremail.generateAuthToken(); //Here useremail is also a instance of Register so we use useremail instead of registerEmployee because it's not defined here 

        //OPTIMIZE: Cookies in login page
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 60000),
            httpOnly: true,
            // secure: true
        });

        if (isMatch) {
            res.status(201).render("index");
        } else {
            res.send("Invalid Login Details");
        }
    } catch (err) {
        res.status(400).send("Invalid Password Details");
    }
});

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
})