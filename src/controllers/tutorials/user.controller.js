
const db = require('../../models')

const User = db.users
const Uploadhistory= db.uploadhistory
const ivrs = db.ivrs
const Tutorials = db.tutorials

function userController(){
  return{
    async postRegister(req,res){
      const userData = req.body

      if (!userData.fullname && !userData.username && !userData.dob && userData.password){
        res.send('All Fields Are Mandatory')
      }else{
        User.findOne({
          where: {username: userData.username}
        }).then((user)=>{
          if (! user){
            const newUser = new User({
              fullname: userData.fullname,
              username: userData.username,
              dob: userData.dob,
              password: userData.password
            })
            newUser.save()
            res.redirect('/login')
          }else{
            res.send('user already exists')
          }
        })
      }
    },
    async postLogin (req, res){
      const userdata = req.body

      User.findOne({where: {username: userdata.username, password: userdata.password}}).then((user)=>{
        if (!user){
          res.redirect('/login')
        }else{
          res.redirect('/data')
        }
        
      })
    },
    async logout ( req,res){
      req.session.destroy((err)=>{
        if(err){
          console.log(err)
        }else{
          res.redirect('/')
        }

      })
    },
    async uploadHistory(req,res){
      Uploadhistory.findAll().then((history)=>{
        // res.send(history)
         res.render('uploaddetails',{'uploads':history})

      })
       
      
    },
    async test (req,res){
      await Tutorials.findAll().then((alldata)=>{
       
        // ivrs.findAll().then((ivrsdata)=>{

          // res.send(alldata)
        // res.render('alldata',{'alldata':JSON.stringify(alldata),'ivrs':JSON.stringify(ivrsdata)})
        res.render('alldata',{'alldata':alldata})
        // })
      })
    }
  }
}
module.exports = userController
