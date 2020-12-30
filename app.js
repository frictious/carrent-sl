const   express             = require("express"),
        session             = require("express-session"),
        passport            = require("passport"),
        bodyParser          = require("body-parser"),
        Index               = require("./routes/index"),
        Admin               = require("./routes/admin"),
        flash               = require("connect-flash"),
        methodOverride      = require("method-override"),
        mongoose            = require("mongoose");

require("dotenv").config();
require("./config/login")(passport);
const app = express();
//CONFIG
//App config
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));

//Mongoose connection
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
});

app.use(session({
    secret : "GOD IS GOOD ALL THE TIME",
    resave : true,
    saveUninitialized : true
}));

app.use(bodyParser.urlencoded({extended : false}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

app.use("/", Index);
app.use("/admin", Admin);

//SERVER SETUP
app.listen(process.env.PORT, () => {
    console.log(`Server Started at Port: ${process.env.PORT}`);
});