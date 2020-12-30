const   express             = require("express"),
        User                = require("../models/user"),
        Car                 = require("../models/car"),
        Driver              = require("../models/driver"),
        crypto              = require("crypto"),
        path                = require("path"),
        bcrypt              = require("bcryptjs"),
        multer              = require("multer"),
        passport            = require("passport"),
        Grid                = require("gridfs-stream"),
        mongoose            = require("mongoose"),
        nodemailer          = require("nodemailer"),
        GridFsStorage       = require("multer-gridfs-storage");

const router = express.Router();

require("dotenv").config()
//GRIDFS CONFIGURATION
const URI = process.env.MONGOOSE// || "";
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

//Getting car pictures from different angles
const cpUpload = files.fields([
    {name: 'front', maxCount: 1},
    {name: 'back', maxCount: 1},
    {name: "inside", maxCount : 1},
    {name: "full", maxCount : 1}
]);

//Log in checker
const isLoggedIn = ((req, res, next) => {
    if(req.isAuthenticated()){
        if(req.user.role === "Admin"){
            return next();
        }else{
            res.redirect("/admin/logout");
        }
    }else{
        res.redirect("/admin/login");
    }
});

//Nodemailer Logic
const transporter = nodemailer.createTransport({
    service : "gmail",
    auth: {
        type : "login",
        user : "jtcfinalproject@gmail.com",
        pass : "adminfinal"
    }
});

//Dashboard
router.get("/", isLoggedIn, (req, res) => {
    res.render("admin/dashboard", {title : "Car Rent Admin Dashboard"});
});

//CARS
router.get("/cars", isLoggedIn, (req, res) => {
    Car.find({})
    .then(cars => {
        if(cars){
            res.render("admin/cars", {
                title : "CARS SECTION",
                cars : cars
            });
        }else{
            console.log(err);
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

//Get Car Form
router.get("/car/add", isLoggedIn, (req, res) => {
    res.render("admin/addCar", {title : "ADD CAR SECTION"});
});

//Add Car
router.post("/car/add", cpUpload, (req, res) => {
    if((req.files["front"][0].mimetype === "image/png" || req.files["front"][0].mimetype === "image/jpg") && (req.files["back"][0].mimetype === "image/png" || req.files["back"][0].mimetype === "image/jpg") && (req.files["inside"][0].mimetype === "image/png" || req.files["inside"][0].mimetype === "image/jpg") && (req.files["full"][0].mimetype === "image/png" || req.files["full"][0].mimetype === "image/jpg")){
        Car.create({
            carName : req.body.name,
            carModel : req.body.model,
            noOfDoors : req.body.noOfDoors,
            transmission : req.body.transmission,
            price : req.body.price,
            luggage : req.body.luggage,
            mileage : req.body.mileage,
            engineType : req.body.engineType,
            noOfSeats : req.body.seats,
            quantity : req.body.quantity,
            description : req.body.description,
            front : req.files["front"][0].filename,
            back : req.files["back"][0].filename,
            inside : req.files["inside"][0].filename,
            full : req.files["full"][0].filename
        })
        .then(car => {
            if(car){
                console.log("CAR ADDED SUCCESSFULLY");
                res.redirect("back");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        });
    }else{
        console.log("Images must be either jpg or png");
        res.redirect("back");
    }
});

//Edit Car form page
router.get("/car/:id/edit", isLoggedIn, (req, res) => {
    Car.findById({_id : req.params.id})
    .then(car => {
        if(car){
            res.render("editCar", {
                title : "Edit Car Info",
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

//Update car information page
router.put("/car/:id/edit", cpUpload, (req, res) => {
    if((req.files) && ((req.files["front"][0].mimetype === "image/png" || 
    req.files["front"][0].mimetype === "image/jpg") && 
    (req.files["back"][0].mimetype === "image/png" || 
    req.files["back"][0].mimetype === "image/jpg") && 
    (req.files["inside"][0].mimetype === "image/png" || 
    req.files["inside"][0].mimetype === "image/jpg") && 
    (req.files["full"][0].mimetype === "image/png" || 
    req.files["full"][0].mimetype === "image/jpg"))){
        Car.updateOne({_id : req.params.id}, {
            carName : req.body.name,
            carModel : req.body.model,
            noOfDoors : req.body.noOfDoors,
            transmission : req.body.transmission,
            price : req.body.price,
            luggage : req.body.luggage,
            mileage : req.body.mileage,
            engineType : req.body.engineType,
            noOfSeats : req.body.seats,
            quantity : req.body.quantity,
            description : req.body.description,
            front : req.files["front"][0].filename,
            back : req.files["back"][0].filename,
            inside : req.files["inside"][0].filename,
            full : req.files["full"][0].filename
        })
        .then(updatedCar => {
            if(updatedCar){
                res.redirect("/admin/cars");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        });
    }else if((req.files) && ((req.files["back"][0].mimetype === "image/png" || 
    req.files["back"][0].mimetype === "image/jpg") && 
    (req.files["inside"][0].mimetype === "image/png" || 
    req.files["inside"][0].mimetype === "image/jpg") && 
    (req.files["full"][0].mimetype === "image/png" || 
    req.files["full"][0].mimetype === "image/jpg"))){
        Car.updateOne({_id : req.params.id}, {
            carName : req.body.name,
            carModel : req.body.model,
            noOfDoors : req.body.noOfDoors,
            transmission : req.body.transmission,
            price : req.body.price,
            luggage : req.body.luggage,
            mileage : req.body.mileage,
            engineType : req.body.engineType,
            noOfSeats : req.body.seats,
            quantity : req.body.quantity,
            description : req.body.description,
            back : req.files["back"][0].filename,
            inside : req.files["inside"][0].filename,
            full : req.files["full"][0].filename
        })
        .then(updatedCar => {
            if(updatedCar){
                res.redirect("/admin/cars");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        });
    } else if((req.files) && ((req.files["front"][0].mimetype === "image/png" || 
    req.files["front"][0].mimetype === "image/jpg") && 
    (req.files["inside"][0].mimetype === "image/png" || 
    req.files["inside"][0].mimetype === "image/jpg") && 
    (req.files["full"][0].mimetype === "image/png" || 
    req.files["full"][0].mimetype === "image/jpg"))){
        Car.updateOne({_id : req.params.id}, {
            carName : req.body.name,
            carModel : req.body.model,
            noOfDoors : req.body.noOfDoors,
            transmission : req.body.transmission,
            price : req.body.price,
            luggage : req.body.luggage,
            mileage : req.body.mileage,
            engineType : req.body.engineType,
            noOfSeats : req.body.seats,
            quantity : req.body.quantity,
            description : req.body.description,
            front : req.files["front"][0].filename,
            inside : req.files["inside"][0].filename,
            full : req.files["full"][0].filename
        })
        .then(updatedCar => {
            if(updatedCar){
                res.redirect("/admin/cars");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        });
    }else if((req.files) && ((req.files["front"][0].mimetype === "image/png" || 
    req.files["front"][0].mimetype === "image/jpg") && 
    (req.files["back"][0].mimetype === "image/png" || 
    req.files["back"][0].mimetype === "image/jpg") && 
    (req.files["full"][0].mimetype === "image/png" || 
    req.files["full"][0].mimetype === "image/jpg"))){
        Car.updateOne({_id : req.params.id}, {
            carName : req.body.name,
            carModel : req.body.model,
            noOfDoors : req.body.noOfDoors,
            transmission : req.body.transmission,
            price : req.body.price,
            luggage : req.body.luggage,
            mileage : req.body.mileage,
            engineType : req.body.engineType,
            noOfSeats : req.body.seats,
            quantity : req.body.quantity,
            description : req.body.description,
            front : req.files["front"][0].filename,
            back : req.files["back"][0].filename,
            full : req.files["full"][0].filename
        })
        .then(updatedCar => {
            if(updatedCar){
                res.redirect("/admin/cars");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        });
    }else if((req.files) && ((req.files["front"][0].mimetype === "image/png" || 
    req.files["front"][0].mimetype === "image/jpg") && 
    (req.files["back"][0].mimetype === "image/png" || 
    req.files["back"][0].mimetype === "image/jpg") && 
    (req.files["inside"][0].mimetype === "image/png" || 
    req.files["inside"][0].mimetype === "image/jpg"))){
        Car.updateOne({_id : req.params.id}, {
            carName : req.body.name,
            carModel : req.body.model,
            noOfDoors : req.body.noOfDoors,
            transmission : req.body.transmission,
            price : req.body.price,
            luggage : req.body.luggage,
            mileage : req.body.mileage,
            engineType : req.body.engineType,
            noOfSeats : req.body.seats,
            quantity : req.body.quantity,
            description : req.body.description,
            front : req.files["front"][0].filename,
            back : req.files["back"][0].filename,
            inside : req.files["inside"][0].filename,
        })
        .then(updatedCar => {
            if(updatedCar){
                res.redirect("/admin/cars");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        });
    }else{
        Car.updateOne({_id : req.params.id}, {
            carName : req.body.name,
            carModel : req.body.model,
            noOfDoors : req.body.noOfDoors,
            transmission : req.body.transmission,
            price : req.body.price,
            luggage : req.body.luggage,
            mileage : req.body.mileage,
            engineType : req.body.engineType,
            noOfSeats : req.body.seats,
            quantity : req.body.quantity,
            description : req.body.description,
            // front : req.files["front"][0].filename,
            // back : req.files["back"][0].filename,
            // inside : req.files["inside"][0].filename,
            // full : req.files["full"][0].filename
        })
        .then(updatedCar => {
            if(updatedCar){
                res.redirect("/admin/cars");
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

//Car information delete page
router.delete("/car/:id", (req, res) => {
    Car.findById({_id : req.params.id})
    .then(car => {
        if(car){
            gfs.files.deleteOne({filename : car.full}, (err) =>{
                if(!err){
                    console.log("DELETED FULL CAR IMAGE SUCCESSFULLY");
                    gfs.files.deleteOne({filename : car.inside}, (err, deleted) =>{
                        if(deleted){
                            console.log("DELETED INSIDE CAR IMAGE SUCCESSFULLY");
                            gfs.files.deleteOne({filename : car.back}, (err, deleted) =>{
                                if(deleted){
                                    console.log("DELETED BACK CAR IMAGE SUCCESSFULLY");
                                    gfs.files.deleteOne({filename : car.front}, (err, deleted) =>{
                                        if(deleted){
                                            console.log("DELETED FRONT CAR IMAGE SUCCESSFULLY");
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    Car.deleteOne({_id : req.params.id}, (err) => {
        if(err){
            console.log(err);
            res.redirect("back");
        }else{
            console.log("CAR DELETED SUCCESSFULLY");
            res.redirect("back");
        }
    });
});

//=======================================================================================
//ADMIN SECTION
//Admin account route
router.get("/signUp", (req, res) => {
    res.render("./admin/registration", {title : "Admin Registration Page"});
});

router.post("/signUp", (req, res) => {
    if(req.body.password === req.body.retypePassword){
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(req.body.password, salt)
            .then(hash => {
                User.findOne({email : req.body.email})
                .then(foundUser => {
                    if(foundUser){
                        console.log("ACCOUNT EXISTS");
                        res.redirect("/admin/login");
                    }else{
                        const newAdmin = new User({
                            name : req.body.name,
                            email : req.body.email,
                            contact : req.body.contact,
                            password : hash,
                            description : req.body.description,
                            role : "Admin"
                        });
        
                        newAdmin.save()
                        .then(admin => {
                            if(admin){
                                console.log("ACCOUNT CREATED SUCCESSFULLY");
                                res.redirect("/admin/login");
                            }
                        })
                    }
                })
            })
            .catch(err => {
                if(err){
                    console.log(err);
                    res.redirect("/admin/signUp");
                }
            })
        })
    }
});

//Admin Login
router.get("/login", (req, res) => {
    res.render("./admin/login", {title : "Admin Login"});
});

//Admin Login POST Route
router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect : "/admin",
        failureRedirect : "/admin/login"
    })(req, res, next);
});

//Admin Logout Route
router.get("/logout", isLoggedIn, (req, res) => {
    req.logout();
    res.redirect("/admin/login");
});

//Admin Profile Route
router.get("/profile/:id", isLoggedIn, (req, res) => {
    User.findById({_id : req.params.id})
    .then(admin => {
        if(admin){
            res.render("profile", {
                admin : admin
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

//Admin Profile Route Logic
router.put("/profile/:id", (req, res) => {
    if((req.body.password !== undefined) && (req.body.password === req.body.retypePassword)){
        bcrypt.genSalt(10)
        .then(salt => {
            bcrypt.hash(req.body.password, salt)
            .then(hash => {
                User.findOneAndUpdate({_id : req.params.id}, {
                    name : req.body.name,
                    email : req.body.email,
                    contact : req.body.contact,
                    password : hash,
                    description : req.body.description
                })
                .then(admin => {
                    if(admin){
                        console.log("ACCOUNT UPDATED SUCCESSFULLY");
                        res.redirect("back");
                    }
                })
            })
            .catch(err => {
                if(err){
                    console.log(err);
                    res.redirect("back");
                }
            })
        })
    }else{
        User.findOneAndUpdate({_id : req.params.id}, {
            name : req.body.name,
            email : req.body.email,
            contact : req.body.contact,
            description : req.body.description
        })
        .then(admin => {
            if(admin){
                console.log("ACCOUNT UPDATED SUCCESSFULLY");
                res.redirect("back");
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
                res.redirect("back");
            }
        })
    }
    
});

//Show all Admins
router.get("/admins", isLoggedIn, (req, res) => {
    User.find({role : "Admin"})
    .then(admins => {
        if(admins){
            res.render("admin", {
                admins : admins
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

//Admin Delete Route
router.delete("/:id", (req, res) => {
    User.findOneAndRemove({_id : req.params.id})
    .then(admin => {
        if(admin){
            console.log("ADMIN ACCOUNT DELETED SUCCESSFULLY");
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
//END OF ADMIN SECTION
//=======================================================================================

//=======================================================================================
//DRIVERS SECTION
router.get("/drivers", isLoggedIn, (req, res) => {
    Driver.find({})
    .then(drivers => {
        if(drivers){
            res.render("admin/driver", {
                title : "Drivers that have applied",
                drivers : drivers
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

//Delete Drivers Information
router.delete("/driver/:id", (req, res) => {
    Driver.findOneAndDelete({_id : req.params.id})
    .then(driver => {
        if(driver){
            console.log("DELETED DRIVER INFORMATION");
            res.redirect("back");
            
            gfs.files.deleteOne({filename : driver.cv}, (err) => {
                if(err){
                    console.log(err);
                    res.redirect("back");
                }else{
                    console.log("DRIVER C.V DELETED SUCCESSFULLY");
                }
            });
        }
    })
    .catch(err => {
        if(err){
            console.log("DRIVER INFORMATION DELETED SUCCESSFULLY");
            res.redirect("back");
        }
    });
});

//Send mail to Driver
router.post("/driver/call/:id", (req, res) => {
    Driver.findById({_id : req.params.id})
    .then(driver => {
        if(driver){
            const mailOpttions = {
                from : "jtcfinalproject@gmail.com",
                to : driver.email,
                subject : "Call for Interview",
                html : `<p>Dear ${driver.name},</p> <p>Hope this mail finds you well.</p><p>Thank you for applying for the position of a driver.</p><p>After going through the document you sent us, you have been selected for an interview next week Monday.</p><p>Ensure when coming you bring along your documents.</p><p>Regards</p><Management</p>`
            }

            transporter.sendMail(mailOpttions)
            .then(mail => {
                if(mail){
                    Driver.findOneAndRemove({_id : driver._id})
                    .then(driver => {
                        if(driver){
                            console.log("DRIVER CALLED FOR INTERVIEW AND REMOVED FROM THE LIST");
                            res.redirect("back");
                        }
                    })
                }
            })
            .catch(err => {
                if(err){
                    console.log("ERROR SENDING INTERVIEW MESSAGE TO APPLICANT");
                    res.redirect("back");
                }
            });
        }
    })
})

//END OF DRIVERS SECTION
//=======================================================================================

//=======================================================================================
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

//END OF VIEW GFS FILES
//=======================================================================================

module.exports = router;