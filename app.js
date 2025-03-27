if(process.env.NODE_ENV != "production"){
    require('dotenv').config() //dotenv makes env variables available in the entire project
}
// console.log(process.env.SECRET);
//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl = process.env.ATLASDB_URL; 

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));



async function main(){
    await mongoose.connect(dbUrl);
};

main().then(()=>{
    console.log("connect to DB");
}).catch((err)=>{
    console.log("err");
});

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto :{
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600,
})

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires: Date.now() * 7 * 24 * 60 * 60 *1000,
        maxAge : 7 * 24 * 60 * 60 *1000,
        httpOnly : true,//crossScripting attacks
    }
};






//session middleware (should be implemented before using passport)
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));// authenticate() - generates a fun used in LocalStrategy
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//intializing locals variables of ejs templates using middleware
app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});


app.get("/",(req,res)=>{
    res.render("/listings");
});

//configuring all routes of listing and reviews
app.use("/listings",listingRouter)
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

//if request doesn't match any route
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
});
//error handling middleweare
app.use((err,req,res,next)=>{
    let {statusCode =500, message="Something went wrong!"} = err;
    // res.status(statusCode).send(message);
    // res.send("something went wrong");\
    res.status(statusCode).render("error.ejs",{message});
});


app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});

