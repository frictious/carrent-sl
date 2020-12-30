require("dotenv").config();
const   express         = require("express"),
        bcrypt          = require("bcryptjs"),
        passport        = require("passport"),
        User            = require("../models/user"),
        Driver          = require("../models/driver"),
        crypto          = require("crypto"),
        multer          = require("multer"),
        path            = require("path"),
        Grid            = require("gridfs-stream"),
        mongoose        = require("mongoose"),
        GridFsStorage   = require("multer-gridfs-storage"),
        Car             = require("../models/car"),
        nodemailer      = require("nodemailer");

const router = express.Router();

//Nodemailer Logic
const transporter = nodemailer.createTransport({
    service : "gmail",
    auth: {
        type : "login",
        user : "jtcfinalproject@gmail.com",
        pass : "adminfinal"
    }
});

//Request
// const options = {
//     'method': 'GET',
//     'url': 'https://api.flutterwave.com/v3/transactions/123456/verify',
//     'headers': {
//       'Content-Type': 'application/json',
//       'Authorization': 'Bearer {{FLWSECK_TEST-c68428b7e1f842fe8e7aaf8ff3fac8c2-X}}'
//     }
// };
// request(options, function (error, response) { 
// if (error) throw new Error(error);
// console.log(response.body);
// });

let CARS_PER_PAGE = 9;

//GRIDFS COLLECTION CONFIG
const URI = process.env.MONGOOSE
const conn = mongoose.createConnection(URI, {
    useUnifiedTopology : true,
    useNewUrlParser : true,
    useFindAndModify: false
});

//GRIDFS CONFIG FOR IMAGES
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("files");
});

//GRIDFS STORAGE CONFIG
const storage = new GridFsStorage({
    url: URI,
    options : {useUnifiedTopology : true},
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
            if (err) {
                return reject(err);
            }
            const filename = buf.toString('hex') + path.extname(file.originalname);
            const fileInfo = {
                filename: filename,
                bucketName: "files"
            };
            resolve(fileInfo);
            });
        });
    }
});

//Multer config for images
const files = multer({ storage });

//Log in checker
const isLoggedIn = ((req, res, next) => {
    if(req.isAuthenticated()){
        if(req.user.role === "Customer"){
            return next();
        }else{
            res.redirect("/logout");
        }
    }else{
        res.redirect("/login");
    }
});

//ROUTES
router.get("/", (req, res) => {
    Car.find()
    .limit(3)
    .then(cars => {
        if(cars){
            res.render("index", {cars : cars});
        }
    })
    .catch(err => {
        if(err){
            console.log(err);
            res.redirect("back")
        }
    });
});

//About Route
router.get("/about", (req, res) => {
    res.render("about");
});

//Car Route
router.get("/cars", (req, res) => {
    let page = req.query.page;
    Car.find()
    .skip((page - 1) * CARS_PER_PAGE)
    .limit(CARS_PER_PAGE)
    .then(cars => {
        if(cars){
            res.render("cars", {
                cars : cars
            });
        }else{
            console.log("NO CAR FOUND");
            res.redirect("back");
        }
    })
    .catch(err => {
        if(err){
            console.log(err);
            res.redirect("back");
        }
    });
});

//Car Single Route
router.get("/cars/:id", (req, res) => {
    Car.findById({_id : req.params.id}, (err, car) => {
        if(car){
            Car.find({carModel : car.carModel}, (err, cars) => {
                if(cars){
                    res.render("carSingle", {
                        car : car,
                        cars : cars
                    });
                }else{
                    res.render("carSingle", {
                        car : car
                    });
                }
            });
        }else{
            console.log("CAR NOT FOUND");
            res.redirect("back");
        }
    });
});

//Contact Route
router.get("/contact", (req, res) => {
    res.render("contact");
});

//Contact Route Logic
router.post("/contact", (req, res) => {
    const mailOptions = {
        from : req.body.email,
        to : "jtcfinalproject@gmail.com",
        subject : "Message from Website Contact Form",
        html : `<p>Message from contact form. senders email is: ${req.body.email}, message is.</p>
        ${req.body.message}`
    }

    transporter.sendMail(mailOptions)
    .then(mail => {
        if(mail){
            console.log("MESSAGE SENT SUCCESSFULLY");
            res.redirect("back");
        }
    })
    .catch(err => {
        if(err){
            console.log(err);
            res.redirect("back");
        }
    });
});

//Driver Route
router.get("/driver", (req, res) => {
    res.render("driver");
});

//Driver Route Logic
router.post("/driver", files.single("cv"), (req, res) => {
    if(req.file.mimetype === "application/pdf"){
        Driver.create({
            name : req.body.name,
            email : req.body.email,
            address : req.body.address,
            contact : req.body.contact,
            cv : req.file.filename,
            cvName : req.file.originalname
        }, (err, driver) => {
            if(driver){
                const mailOpttions = {
                    from : "jtcfinalproject@gmail.com",
                    to : req.body.email,
                    subject : "Application Received",
                    html : `<p>Dear ${req.body.name},</p> <p>Hope this mail finds you well.</p><p>Thank you for applying for the position of a driver.</p><p>We will get back to you shortly in relation to your application.</p><p>Regards</p><Management</p>`
                }

                transporter.sendMail(mailOpttions)
                .then(mail => {
                    if(mail){
                        console.log("APPLICATION SENT SUCCESSFULLY");
                        res.redirect("back");
                    }
                })
                .catch(err => {
                    if(err){
                        console.log("ERROR SENDING MAIL TO APPLICANT");
                        res.redirect("back");
                    }
                });

                const mailOpttions2 = {
                    from : req.body.email,
                    to : "jtcfinalproject@gmail.com",
                    subject : "Drivers Application Received",
                    html : `<p>Dear Admin,</p> <p>Hope this mail finds you well.</p><p>This is to inform you that ${req.body.name} has successfully applied for a drivers position.</p>`
                }

                transporter.sendMail(mailOpttions2)
                .then(mail => {
                    if(mail){
                        console.log("APPLICATION RECEIPT SENT SUCCESSFULLY");
                        res.redirect("back");
                    }
                })
                .catch(err => {
                    if(err){
                        console.log("ERROR SENDING MAIL TO ADMIN");
                        res.redirect("back");
                    }
                });
            }else{
                console.log(err);
                res.redirect("back");
            }
        });    
    }else{
        console.log("FILE MUST BE PDF");
        res.redirect("back");
    }
});

//Pricing Route
router.get("/pricing", (req, res) => {
    Car.find({})
    .then(cars => {
        if(cars){
            res.render("pricing", {
                cars : cars
            });
        }else{
            console.log("NO CARS FOUND TO PRICE");
            res.redirect("back");
        }
    })
    .catch(err => {
        if(err){
            console.log(err);
            res.redirect("back");
        }
    })
});

//Services Route
// router.get("/services", (req, res) => {
//     res.render("services");
// });

//Customer Register Route
router.get("/register", (req, res) => {
    res.render("signUp");
});

//Customer Register POST Route
router.post("/register", (req, res) => {
    if(req.body.password === req.body.retypePassword){
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(req.body.password, salt)
            .then(hash => {
                User.findOne({email : req.body.email})
                .then(foundUser => {
                    if(foundUser){
                        console.log("ACCOUNT EXISTS");
                        res.redirect("/login");
                    }else{
                        const newCustomer = new User({
                            name : req.body.name,
                            email : req.body.email,
                            password : hash,
                            contact: req.body.contact,
                            address : req.body.address,
                            role : "Customer"
                        });
        
                        newCustomer.save()
                        .then(customer => {
                            if(customer){
                                res.redirect("/login");
                            }
                        })
                    }
                })
            })
        })
        .catch(err => {
            if(err){
                console.log(err);
            }
        })
    }
});

//Customer Profile Route
router.get("/profile/:id", (req, res) => {
    User.findById({_id : req.params.id})
    .then(customer => {
        if(customer){
            res.render("profile", {
                customer : customer
            });
        }
    })
    .catch(err => {
        if(err){
            console.log(err);
            res.redirect("back");
        }
    });

});

//Customer Profile POST Route
router.put("/profile/:id", (req, res) => {
    if(req.body.password !== undefined && (req.body.password === req.body.retypePassword)){
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(req.body.password, salt)
            .then(hash => {
                User.findOneAndUpdate({_id : req.params.id}, {
                    name : req.body.name,
                    email : req.body.email,
                    password : hash,
                    contact: req.body.contact,
                    address : req.body.address,
                })
                .then(customer => {
                    if(customer){
                        res.redirect("back");
                    }
                })
            })
        })
        .catch(err => {
            if(err){
                console.log(err);
            }
        })
    }else if(req.body.password === undefined){
        User.findByIdAndUpdate({_id : req.params.id}, {
            name : req.body.name,
            email : req.body.email,
            contact: req.body.contact,
            address : req.body.address,
        })
        .then(customer => {
            if(customer){
                res.redirect("back");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        });
    }
});

//Customer Forgot Password Route
router.get("/forgotPassword", (req, res) => {
    res.render("forgotPassword");
});

//Customer Forgot Password Update Route
router.put("/forgotPassword", (req, res) => {
    if(req.body.password === req.body.retypePassword){
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(req.body.password, salt)
            .then(hash => {
                User.findOne({email : req.body.email})
                .then(foundUser => {
                    if(foundUser){
                        User.findOneAndUpdate({email : foundUser.email}, {
                            password : hash
                        })
                        .then(customer => {
                            if(customer){
                                res.redirect("back");
                            }
                        })
                        // console.log("ACCOUNT EXISTS");
                        // res.redirect("/login");
                    }else{
                    }
                })
            })
        })
        .catch(err => {
            if(err){
                console.log(err);
            }
        })
    }else{
        console.log("PASSWORDS MUST BE ENTERED AND THEY MUST MATCH");
        res.redirect("back");
    }
});

//Customer Login Route
router.get("/login", (req, res) => {
    res.render("login");
});

//Customer Login Route
router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect : "/",
        failureRedirect : "/login"
    })(req, res, next);
});

//Customer Logout Route
router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

//Customer Checkout Form
router.get("/checkout/:id", (req, res) => {
    Car.findById({_id : req.params.id})
    .then(car => {
        if(car){
            res.render("checkout", {
                car : car
            });
        }
    })
    .catch(err => {
        if(err){
            console.log(err);
            res.redirect("back");
        }
    });

});

// //Stripe checkout form
// router.post("/create-checkout-secction/:id", (req, res) => {

//     Car.findById({_id : req.params.id})
//     .then(car => {
//         if(car){
//             let price = car.price * 100
//             const session = stripe.checkout.sessions.create({
//                 payment_method_types: ['card'],
//                 mode: 'payment',
//                 // customer_email : req.body.email,
//                 client_reference_id : req.params.id,
//                 success_url: `${req.protocol}://${req.get('host')}/success`,
//                 cancel_url: `${req.protocol}://${req.get('host')}/failure`,
//                 line_items: [
//                     {
//                     currency: 'sll',
//                     name: `${car.carName}`,
//                     amount: `${price}`,
//                     quantity: 1,
//                     images : [`${req.get('host')}/files/${car.full}`],
//                     description : `${car.description}`
//                     },
//                 ],
//                 });
//                 res.json({ id: session.id });
//         }
//     })
    

// });

//Success route
router.get("/success/:done", (req, res) => {
    res.send("<h1>PAYMENT SUCCESSFUL</h1>");
});

//Failure route
router.get("/failure", (req, res) => {
    res.send("<h1>PAYMENT UNSUCCESSFUL</h1>");
});

//VIEW GFS FILES
router.get("/files/:filename", (req, res) => {
    gfs.files.findOne({filename : req.params.filename}, (err, foundFile) => {
        if(foundFile){
            const readstream = gfs.createReadStream(foundFile.filename);
            readstream.pipe(res);
        }else{
            console.log(err);
        }
    });
});

// router.get("*", (req, res) => {
//     res.send(`<h1>404 Error</h1><h3>Page ${req.originalUrl} not found</h3>`);
// });

module.exports = router;
