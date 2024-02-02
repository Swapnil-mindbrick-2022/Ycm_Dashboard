
const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const question_table = sequelize.define("question_table",{
    id:{
      type:Sequelize.INTEGER,
      autoIncrement:true,
      allowNull:false,
      primaryKey:true
    },
    District: {
      type: Sequelize.STRING
    },
    PARLIAMENT:{
      type: Sequelize.STRING,
  
      // ignoreDuplicates:true
    },
   
    R_Constituency:{
      type: Sequelize.STRING
    },
    Date: {
      type: Sequelize.STRING
      
    },
    
    ['Set']:{
      type: Sequelize.STRING
    },
    ["SET_F"]:{
      type: Sequelize.STRING
    },
    ['Consider']:{
      type: Sequelize.STRING
    },
    
    ["Question_1"]:{
        type: Sequelize.STRING
      },
      ["Question_2"]:{
        type: Sequelize.STRING
      },
      ["Question_3"]:{
        type: Sequelize.STRING
      },
      ["Question_4"]:{
        type: Sequelize.STRING
      }, ["Question_5"]:{
        type: Sequelize.STRING
      }
  }, {
    timestamps: false
  })
  return  question_table 

}