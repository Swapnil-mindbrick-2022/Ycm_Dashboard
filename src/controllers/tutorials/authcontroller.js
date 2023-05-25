const twilio = require('twilio')
const db = require("../../models");
const user = db.users


const generateOtp = async (req,res)=>{
    const username = req.body.username
    console.log('this is username',username)

      // Generate a random OTP (e.g., 6-digit number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // const otpExpiry = new Date(Date.now() + 5 * 60000);
    function calculateExpirationTime() {
      const currentDateTime = new Date();
      const expirationTime = new Date(currentDateTime.getTime() + 15 * 60 * 1000); // Add 15 minutes
    
      return expirationTime;
    }

        user.findOne({
            where: {
              username: username
            }
          }).then((User)=>{
            if (User){
                const newobj = {
                    otp : otp,
                    password:otp,
                    otpexpiry : calculateExpirationTime()
                }
                User.update(newobj)
                const mobile = "+91"+username


                const client = twilio('AC319781e51b2fc861f42c8b0b164f18ba', '18078408287d31ba0443fadb091fc58b');
                client.messages.create({
                  body: `Your OTP is: ${otp}`,
                  from: +13159049601,
                  to: mobile
                });
                console.log('User updated successfully.');
                return res.redirect('/');
                
             
              }
              else{
                res.send('user Does Not exists..')
              }

          })
          
    

}

module.exports = {
    generateOtp
}

