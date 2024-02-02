const passport = require("passport");
const userauth=require('../middlewares/Auth/userauth')
// const { urlencoded } = require("body-parser");
const express = require("express");

const router = express.Router();
const excelController = require("../controllers/tutorials/excel.controller");
const userController = require("../controllers/tutorials/user.controller");
const overviewController = require("../controllers/tutorials/overview.controller")
const constituencyController = require('../controllers/tutorials/constituency.controller')
const communityController = require('../controllers/tutorials/community.controller')
const trendController = require('../controllers/tutorials/trend.controller')
const upload = require("../middlewares/upload");
const authcontroller = require('../controllers/tutorials/authcontroller')


// const { ivrs } = require("../models");
let routes = (app) => {
  
  router.post('/multipleupload',upload.array('files'),excelController.uploadmuliplefiles)
  router.post('/DPC_Data',overviewController.DPC_data)
  router.get('/parliament',overviewController.Parliament)//axios call for parliament based on districts----
  router.get('/caste',overviewController.getCaste) //axios call for caste based on districts and parliament---
  router.post('/TDPJSPAlliance',overviewController.TDPJSPAlliance)
  router.get('/dist_caste',overviewController.getDistCaste)
  router.post('/tdpfull',overviewController.TDPFull) //for TDP fullData
  router.post('/jspfull',overviewController.JSPFull) //for JSP FULL DATA--

  // router.get("/getalldata",userauth, excelController.getTutorials);
  // router.get("/download",excelController.download);
  router.post("/register", userController().postRegister);  // post to register user
  router.post('/login',passport.authenticate('local',{successRedirect:'/homepage',failureRedirect:'/'}));
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
  router.post('/PrefferdMLAByCaste',constituencyController.PrefferdMLAByCaste)
  router.post('/PrefferdCMByCaste',constituencyController.PrefferdCMByCaste)
  router.post('/TDP_JSP_Alliance',constituencyController.TDP_JSP_Alliance)
  router.post('/PrefferYSRCPCoordinator',constituencyController.PrefferYSRCPCoordinator)
  router.post('/PrefferYSRCPCoordinatorcandidate',constituencyController.PrefferYSRCPCoordinatorCandidate)
  
  router.get('/districtAndParliaments',communityController.districtAndParliaments)
  router.get('/distrctParliment',trendController.DISTRICT_PARLIMENT)
  router.post('/TrendReport',trendController.TrendReport)
  router.post('/TrendReport2',trendController.TrendReport2)
  router.post('/TrendReport3',trendController.TrendReport3)
  router.post('/TrendReport4',trendController.TrendReport4)
  router.post('/sendotp',authcontroller.generateOtp)




  router.get('/homepage',userauth,(req,res)=>{
    res.render('homepage')
    
})

router.get('/overview',(req,res)=>{
    res.render('overviewpage')
})

router.get('/constituency',userauth, (req,res)=>{
    res.render('constituency')
})
router.get('/community',userauth,(req,res)=>{
  res.render('community')
})
router.get('/trend',userauth,(req,res)=>{
  res.render('Trend')
})

router.get('/trendysrcp',userauth,(req,res)=>{
  res.render('trendysrcp')
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


