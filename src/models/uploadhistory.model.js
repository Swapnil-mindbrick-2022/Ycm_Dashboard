// const tutorials = require('./tutorial.model')
const Sequelize = require('sequelize')
module.exports = (sequelize, Sequelize) => {
  
    const uploadhistory = sequelize.define("uploadhistory",{
    
       Name:{
        type: Sequelize.STRING,
       },
      filename: {
        type: Sequelize.STRING
      },
      // uploadtime:{
      //   type: Sequelize.DATE 
      // }

})
    return uploadhistory

}









    
  
  
    