const express = require('express');
const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");
const { validateSignUpData } = require('./utils/validation');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { userAuth } = require('./middlewares/auth');

app.use(express.json());
app.use(cookieParser());

app.post("/signup", async (req, res) => {
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

app.post("/login", async (req, res) => {
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

app.get("/profile", userAuth, async (req, res) => {

    try {

        const user = req.user;

        res.send(user);
    } catch (err) {
        res.status(400).send("Error !" + err.message);

    }

});

app.post("/sendConnectionRequest", userAuth, async (req, res) => {

    const user = req.user;

    //Sending a connection request
    console.log("Sending a connection request");

    res.send(user.firstName + " sent the connection request!");

});

connectDB().then(() => {
    console.log("Database connection successfully...");
    const port = 3000;

    app.listen(port, () => {
        console.log(`server started and listening on port: ${port}`);
    });
}).catch((err) => {
    console.log("Database cannot be connected");
});

