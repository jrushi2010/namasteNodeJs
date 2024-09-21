const express = require('express');
const User = require("../models/user");
const { validateSignUpData } = require('../utils/validation');
const bcrypt = require('bcrypt');

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
    try {
        // validation of data
        validateSignUpData(req);

        const { firstName, lastName, emailId, password, age, gender } = req.body;

        //encrypt the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Creating a new instance of the user model
        const user = new User({
            firstName, lastName, emailId, password: passwordHash, age, gender
        });


        await user.save();
        res.status(201).send("User added successfully.")
    } catch (err) {
        res.status(400).send("Error saving the user!" + err.message);
    }

});

authRouter.post("/login", async (req, res) => {
    try {

        const { emailId, password } = req.body;

        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("Invalid credentials");
        }

        const isPasswordValid = await user.validatePassword(password);

        if (isPasswordValid) {

            //create a jwt Token
            const token = await user.getJWT();

            // Add the token to cookie and send the response back to the user
            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000),
            });

            res.send("Login successfully...!!!");
        } else {
            throw new Error("Invalid credentials");
        }

    } catch (err) {
        res.status(400).send("Error saving the user!" + err.message);
    }
});

module.exports = authRouter;