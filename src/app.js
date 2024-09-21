const express = require('express');
const connectDB = require("./config/database");
const app = express();
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cookieParser());

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/requests');

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);

connectDB().then(() => {
    console.log("Database connection successfully...");
    const port = 3000;

    app.listen(port, () => {
        console.log(`server started and listening on port: ${port}`);
    });
}).catch((err) => {
    console.log("Database cannot be connected");
});

