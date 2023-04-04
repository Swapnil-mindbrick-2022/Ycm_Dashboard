
const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const Trenddata = sequelize.define("Trenddata",{
    id:{
      type:Sequelize.INTEGER,
      autoIncrement:true,
      allowNull:false,
      primaryKey:true
    },
    DISTRICT: {
      type: Sequelize.STRING
    },
    PARLIAMENT: {
        type: Sequelize.STRING
      },
    CONSTITUENCY:{
      type: Sequelize.STRING,
   // ignoreDuplicates:true
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
    ['2019_OTHERS']:{
      type: Sequelize.STRING
    },
    
  }, {
    timestamps: false
  })
  return  Trenddata 

}
