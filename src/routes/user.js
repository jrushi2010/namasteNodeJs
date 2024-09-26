const express = require('express');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const userRouter = express.Router();

// get all the pending connection requests fro the loggedIn user
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const connectionRequest = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested"
        }).populate("fromUserId", ["firstName", "lastName", "photoUrl", "skills", "about"]);

        res.json({
            message: "Data fetched successfully",
            data: connectionRequest
        });


    } catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }

});

userRouter.get("/user/connections", userAuth, async (req, res) => {
    try {

        const loggedInUser = req.user;

        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUser._id, status: "accepted" },
                { fromUserId: loggedInUser._id, status: "accepted" },
            ],
        })
            .populate("fromUserId", ["firstName", "lastName", "age", "gender", "skills", "about"])
            .populate("toUserId", ["firstName", "lastName", "gender", "age", "skills", "about"]);

        const data = connectionRequest.map((row) => {
            if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
                return row.toUserId
            }
            return row.fromUserId;
        });

        res.json({ data });

    } catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }
});

userRouter.get("/feed", userAuth, async (req, res) => {

    try {

        // user should see all the user cards except 
        //  his own card
        //  his connections 
        //  ignored people
        //  already sent the connection request 

        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        limit = limit > 50 ? 50 : limit;
        const skip = (page - 1) * limit;

        // find all connection requests (sent + received)
        const connectionRequest = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id }
            ],
        }).select("fromUserId toUserId");

        const hideUsersFromFeed = new Set();
        connectionRequest.forEach(req => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });

        const users = await User.find({
            $and: [
                { _id: { $nin: Array.from(hideUsersFromFeed) }, },
                { _id: { $ne: loggedInUser._id } }
            ]
        }).select("firstName lastName age gender skills about").skip(skip).limit(limit);

        res.send(users);

    } catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }

});

module.exports = userRouter;