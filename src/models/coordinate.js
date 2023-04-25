
const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const cordinates = sequelize.define("cordinates",{
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
    ['R.Constituency']: {
      type: Sequelize.STRING
    }
  }, {
    timestamps: false
  })
  return  cordinates 

}
