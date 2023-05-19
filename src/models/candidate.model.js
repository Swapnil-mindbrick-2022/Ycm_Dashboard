const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const Candidate = sequelize.define("candidatedata",{
    id:{
      type:Sequelize.INTEGER,
      autoIncrement:true,
      allowNull:false,
      primaryKey:true
    },
    District: {
      type: Sequelize.STRING
    },

    ['R.Constituency']:{
      type: Sequelize.STRING,
   // ignoreDuplicates:true
    },
    
    ['Candidate']: {
      type: Sequelize.STRING
    },
    ['Week']:{
      type: Sequelize.STRING
    },
    Date: {
      type: Sequelize.STRING
      
    },
  
    
  }, {
    timestamps: false
  })
  return  Candidate 

}
