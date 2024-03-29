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


// Assuming you have Express configured and 'passport' and 'express-session' modules installed
// const LocalStrategy = require('passport-local').Strategy;
// const db = require('../models');
// const Sequelize = require('sequelize');
// const User = db.users;

// exports.initializingPassport = (passport) => {
//   passport.use(
//     new LocalStrategy(
//       {
//         passReqToCallback: true, // Ensure that the request object is passed to the callback
//       },
//       async (req, username, password, done) => {
//         try {
//           const currentDateTime = new Date();
//           const user = await User.findOne({
//             where: {
//               username: username,
//               otpexpiry: {
//                 [Sequelize.Op.gt]: currentDateTime,
//               },
//             },
//           });

//         //   if (!user) {
//         //     console.log('User not found or OTP expired.');
//         //     return done(null, false);
//         //   }

//           // Check if the device is allowed
//           // const allowedDevices = ['mac_address_1', 'mac_address_2', 'ipad_address_1'];
//           const allowedDevices = ['192.168.29.120'];
//           const device = '192.168.29.120'; // Replace with the actual device MAC address or device identifier

//           // Retrieve user's IP address from the request object
//           const userIpAddress = req.connection.remoteAddress;
//           console.log(userIpAddress);

//           if (!allowedDevices.includes(device) || userIpAddress !== '192.168.29.120') {
//             console.log('Device not allowed or IP address mismatch.');
//             return done(null, false);
//           }

//           if (user.password !== password) {
//             console.log('OTP does not match.');
//             return done(null, false);
//           }

//           return done(null, user);
//         } catch (error) {
//           return done(error, false);
//         }
//       }
//     )
//   );

//   passport.serializeUser(function (user, done) {
//     done(null, user.id);
//   });

//   passport.deserializeUser(function (id, done) {
//     User.findByPk(id).then(function (user) {
//       if (user) {
//         done(null, user.get());
//       } else {
//         done(user.errors, null);
//       }
//     });
//   });
// };

// const LocalStrategy = require('passport-local').Strategy;
// const db = require('../models');
// const Sequelize = require('sequelize');
// const User = db.users;
// const os = require('os');

// exports.initializingPassport = (passport) => {
//   passport.use(
//     new LocalStrategy(
//       {
//         passReqToCallback: true, // Ensure that the request object is passed to the callback
//       },
//       async (req, username, password, done) => {
//         try {
//           const currentDateTime = new Date();
//           const user = await User.findOne({
//             where: {
//               username: username,
//             //   otpexpiry: {
//             //     [Sequelize.Op.gt]: currentDateTime,
//             //   },
//             },
//           });

//           if (!user) {
//             console.log('User not found or OTP expired.');
//             return done(null, false);
//           }

//           // Check if the device is allowed
//           // const allowedDevices = ['mac_address_1', 'mac_address_2', 'ipad_address_1'];
     
//           if (user.password !== password) {
//             console.log('OTP does not match.');
//             return done(null, false);
//           }
//           const allowedDevices = ['192.168.33.1'];
//           const device = '192.168.33.1'; // Replace with the actual device MAC address or device identifier
//            // Retrieve the system's IPv4 address
//       const systemIpAddress = Object.values(os.networkInterfaces())
//       .flat()
//       .filter((iface) => iface.family === 'IPv4' && !iface.internal)
//       .map((iface) => iface.address)[0];

//     console.log(systemIpAddress);
//           // Retrieve user's IP address from the request headers
//           const userIpAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//           console.log(userIpAddress);
//           const userip = await User.findOne({
//             where: {
//               username: username,
            
//             },
//           }).then((data)=>{
//             const newobjest = {otp:userIpAddress}
//             data.update(newobjest)
//           });

//         //   if (!allowedDevices.includes(device) || userIpAddress !== '192.168.33.1') {
//         //     console.log('Device not allowed or IP address mismatch.');
//         //     return done(null, false);
//         //   }


//           return done(null, user);
//         } catch (error) {
//           return done(error, false);
//         }
//       }
//     )
//   );

//   passport.serializeUser(function (user, done) {
//     done(null, user.id);
//   });

//   passport.deserializeUser(function (id, done) {
//     User.findByPk(id).then(function (user) {
//       if (user) {
//         done(null, user.get());
//       } else {
//         done(user.errors, null);
//       }
//     });
//   });
// };
