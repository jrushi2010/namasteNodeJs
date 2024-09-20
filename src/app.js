const express = require('express');
const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");
const { validateSignUpData } = require('./utils/validation');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

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

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (isPasswordValid) {

            //create a jwt Token
            const token = await jwt.sign({ _id: user._id }, "DEV@Tinder$790");
            console.log(token);

            // Add the token to cookie and send the response back to the user
            res.cookie("token", token);



            res.send("Login successfully...!!!");
        } else {
            throw new Error("Invalid credentials");
        }

    } catch (err) {
        res.status(400).send("Error saving the user!" + err.message);
    }
});

app.get("/profile", async (req, res) => {

    try {
        const cookies = req.cookies;

        const { token } = cookies;
        //validate my token 
        const decodedMessage = await jwt.verify(token, "DEV@Tinder$790");

        const { _id } = decodedMessage;

        console.log("Logged in user is: " + _id);

        const user = await User.findById(_id);

        if (!user) {
            throw new Error("User does not exists...");
        }

        res.send(user);
    } catch (err) {
        res.status(400).send("Error !" + err.message);

    }

});

app.get("/user", async (req, res) => {
    const userEmail = req.body.emailId;

    try {
        const user = await User.findOne({ emailId: userEmail });
        if (!user) {
            res.status(404).send("User not found");
        } else {
            res.status(200).send(user);
        }
    } catch (err) {
        res.status(400).send("Something went wrong");
    }

});

app.get("/feed", async (req, res) => {

    try {
        const users = await User.find();
        res.status(200).send({
            data: users,
        });
    } catch (err) {
        console.log("Error:" + err.message)
    }
});

app.delete("/user", async (req, res) => {
    const userId = req.body.userId;

    try {
        await User.findByIdAndDelete(userId);

        res.status(204).send("deleted successfully");
    } catch (err) {
        console.log("Error:" + err.message)

    }

});

app.patch("/user/:userId", async (req, res) => {
    const userId = req.params?.userId;
    const UserData = req.body;

    try {
        const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age", "skills"];

        const isUpdateAllowed = Object.keys(UserData).every(k => ALLOWED_UPDATES.includes(k));

        if (!isUpdateAllowed) {
            throw new Error("Update not allowed");
        }

        if (UserData?.skills.length > 10) {
            throw new Error("Skills cannot be more than 10");
        }

        const user = await User.findByIdAndUpdate({ _id: userId }, UserData, { returnDocument: "after", runValidators: true });

        res.status(200).send({
            message: "User Updated Successfully",
            data: user
        });
    } catch (err) {
        res.status(400).send("update failed " + err.message);
    }
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

