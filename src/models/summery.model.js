
const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const summery = sequelize.define("summery",{
    id:{
      type:Sequelize.INTEGER,
      autoIncrement:true,
      allowNull:false,
      primaryKey:true
    },
    District: {
      type: Sequelize.STRING
    },
    R_Constituency:{
      type: Sequelize.STRING,
  
      // ignoreDuplicates:true
    },
    ['Mandal']: {
      type: Sequelize.STRING
    },
    YEAR:{
      type: Sequelize.STRING
    },
    ['2019_YSRCP']: {
      type: Sequelize.STRING
    },
    ['2019_TDP']:{
      type: Sequelize.STRING
    },
    ['2019_JSP']:{
      type: Sequelize.STRING
    },
    ['2014_YSRCP']:{
      type: Sequelize.STRING
    },
    ['2014_TDP']:{
        type: Sequelize.STRING 
    },
    ['2014_Others']:{
      type: Sequelize.STRING
    }
  }, {
    timestamps: false
  })
  return  summery 

}
