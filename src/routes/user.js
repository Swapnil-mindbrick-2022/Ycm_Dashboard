const passport = require("passport");
//const userauth=require('../middlewares/Auth/userauth')
// const { urlencoded } = require("body-parser");
const express = require("express");

const router = express.Router();
const excelController = require("../controllers/tutorials/excel.controller");
const userController = require("../controllers/tutorials/user.controller");
const overviewController = require("../controllers/tutorials/overview.controller")
const constituencyController = require('../controllers/tutorials/constituency.controller')
const upload = require("../middlewares/upload");


// const { ivrs } = require("../models");
let routes = (app) => {
  
  router.post('/multipleupload',upload.array('files'),excelController.uploadmuliplefiles)
  router.get('/DPC_Data',overviewController.DPC_data)

  // router.get("/getalldata",userauth, excelController.getTutorials);
  // router.get("/download",excelController.download);
  router.post("/register", userController().postRegister);  // post to register user
  router.post('/login',passport.authenticate('local',{successRedirect:'/data',failureRedirect:'/'}));
  router.get('/logout',userController().logout)
  router.get('/districts',constituencyController.DISTRICT)
  router.get('/constituencies',constituencyController.CONSTITUENCY)
  router.get('/weeks',constituencyController.SURVEYDATE)
  router.post('/CM_Satisfaction',constituencyController.CM_Satisfaction)
  router.post('/TopFiveCast',constituencyController.TopFiveCast)
  router.post('/api/summary-report',constituencyController.SummeryReport);
  router.post('/Mlasatishfaction',constituencyController.Mlasatishfaction)
  router.post('/Castsatisfactionmla',constituencyController.Castsatisfactionmla)
  router.post('/PrefferdCaste',constituencyController.PrefferdCaste)
  router.post('/PrefferMLAcandidate',constituencyController.PrefferMLAcandidate)





  router.get('/homepage',(req,res)=>{
    res.render('homepage')
    
})

router.get('/overview',(req,res)=>{
    res.render('overviewpage')
})

router.get('/constituency',(req,res)=>{
    res.render('constituency')
})

  // router.get('/register',userController.registerpage)
  

  router.get('/register',(req,res)=>{
        res.render('register.ejs')
      })


  router.get('/',(req,res)=>{
  res.render('login')
})

  



  
  app.use("/", router);




  

};
module.exports = routes;

