const express = require('express');
const { userAuth } = require("../middlewares/auth");
const profileRouter = express.Router();
const { validateEditProfileData } = require('../utils/validation');

profileRouter.get("/profile/view", userAuth, async (req, res) => {

    try {

        const user = req.user;

        res.send(user);
    } catch (err) {
        res.status(400).send("Error !" + err.message);

    }

});


profileRouter.patch("/profile/edit", userAuth, async (req, res) => {

    try {
        if (!validateEditProfileData(req)) {
            return new Error("Invalid Edit Request");
        }

        const loggedInUser = req.user;

        Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));

        await loggedInUser.save();

        res.send({
            message: `${loggedInUser.firstName}, your profile updated successfully`,
            data: loggedInUser
        }
        );

    } catch (err) {
        res.status(400).send("ERROR : " + err.message);
    }

});

module.exports = profileRouter;