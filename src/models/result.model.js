
const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const resultdata = sequelize.define("resultdata",{
    id:{
      type:Sequelize.INTEGER,
      autoIncrement:true,
      allowNull:false,
      primaryKey:true
    },
    District: {
      type: Sequelize.STRING
    },
    Constituency:{
      type: Sequelize.STRING,
  
      // ignoreDuplicates:true
    },
    ['Mandal Name']: {
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
  return  resultdata 

}
