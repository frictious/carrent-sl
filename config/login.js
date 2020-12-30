const   bcrypt              = require("bcryptjs"),
        LocalStrategy       = require("passport-local").Strategy,
        User                = require("../models/user");

module.exports = (passport) => {
    passport.use(new LocalStrategy({usernameField : "email"}, (email, password, done) => {
        User.findOne({
            email : email
        })
        .then(admin => {
            if(admin){
                bcrypt.compare(password, admin.password, (err, isMatch) => {
                    if(isMatch){
                        return done(null, admin);
                    }else{
                        console.log("EMAIL/PASSWORD DO NOT MATCH");
                        return done(null, false, {message : "Email/Password do not match"});
                    }
                })
            }else{
                return done(null, false, {message : "Email/Password do not match"});
            }
        })
        .catch(err => {
            if(err){
                console.log(err);
            }
        })
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(null, user);
        });
    });
}
