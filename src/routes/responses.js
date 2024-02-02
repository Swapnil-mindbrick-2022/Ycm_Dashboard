const passport = require("passport");
const userauth=require('../middlewares/Auth/userauth')
// const { urlencoded } = require("body-parser");
const express = require("express");

const router = express.Router();
const excelController = require("../controllers/tutorials/response.controller.js");

const upload = require("../middlewares/upload");



// const { ivrs } = require("../models");
let responseRoutes = (app) => {
  
  router.post('/responsesUpload',upload.array('files'),excelController.uploadResponseFile)
    
  
  router.get('/responseData',(req,res)=>{
    res.render('responsesUplaod.ejs')
  })
  

  
  app.use("/", router);

  




  

};
module.exports = responseRoutes;


