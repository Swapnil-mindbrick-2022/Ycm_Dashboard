const LocalStrategy = require('passport-local').Strategy;
const db=require('../models')
const User=db.users

exports.initializingPassport = (passport)=>{

    passport.use(
        new LocalStrategy( async(username,password,done)=>{
       
        try{
            const user = await User.findOne({
                where:{username:username}
            })
            if (!user) return done(null,false);


        if (user.password !== password) return done(null,false);

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
