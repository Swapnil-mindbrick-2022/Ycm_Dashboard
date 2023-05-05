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
    DISTRICT: {
      type: Sequelize.STRING
    },

    CONSTITUENCY:{
      type: Sequelize.STRING,
   // ignoreDuplicates:true
    },
    
    ['Candidate']: {
      type: Sequelize.STRING
    }
  
    
  }, {
    timestamps: false
  })
  return  Candidate 

}
