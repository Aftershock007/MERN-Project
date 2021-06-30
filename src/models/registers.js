const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const employeeSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    gender: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    confirmpassword: {
        type: String,
        required: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

// TODO: .statics() for static methods and .methods() for instance methods 
employeeSchema.method.generateAuthToken = async function () { //We use this keyword so we can't use fat arrow function
    try {
        const token = jwt.sign({
            _id: this._id
        }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({
            token: token
        });
        await this.save();
        return token;
    } catch (err) {
        res.send(err);
    }
}


//OPTIMIZE: we use "save" because there is registerEmployee.save() method 
//OPTIMIZE: It's a middleware and we convert password into hash 
employeeSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
        this.confirmpassword = await bcrypt.hash(this.password, 10); //TODO: We wouldn't able to see confirmpassword in db
    }
    next();
});

const Register = new mongoose.model("Register", employeeSchema);
module.exports = Register;