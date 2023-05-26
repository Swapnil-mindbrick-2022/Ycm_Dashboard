const LocalStrategy = require('passport-local').Strategy;
const db=require('../models')
const Sequelize = require('sequelize')
const User=db.users

exports.initializingPassport = (passport)=>{

    passport.use(
        new LocalStrategy( async(username,password,done)=>{
            // console.log(username)
            // console.log(password)
       
        try{
            const currentDateTime = new Date();
            const user = await User.findOne({
                where:{username:username,
                otpexpiry: {
                    [Sequelize.Op.gt]: currentDateTime,
                }
            }
            })
            if (!user) {
                console.log('user not found or  OTP Expired..')
                // res.send('sdsfdsf')
                return done(null,false);
            }


        if (user.password !== password){
            console.log('otp does not match...')
            return done(null,false);

        } 

        return done (null, user)

        }
         catch (error){
            return done(error, false)
        }
        
    }))
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function (id, done) {
        User.findByPk(id).then(function (user) {
            if (user) {
                done(null, user.get());
            } else {
                done(user.errors, null);
            }
        });
});
}