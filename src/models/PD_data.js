
const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const datasurvey = sequelize.define("fileddata",{
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
    ['New District']: {
      type: Sequelize.STRING
    },
    R_Constituency:{
      type: Sequelize.STRING
    },
    Date: {
      type: Sequelize.STRING
      
    },
    ["Timestamp"]:{
      type: Sequelize.STRING
    },
    ["Location"]:{
      type: Sequelize.STRING
    },
    ['Audio Url']:{
      type: Sequelize.STRING
    },
    ['Audio Duration (in secs)']:{
        type: Sequelize.STRING 
    },
    ['Offline Mode']:{
      type: Sequelize.STRING
    },
    ['Surveyor Name']:{
      type: Sequelize.STRING
    },
    ['Surveyor Phone Number']:{
      type: Sequelize.STRING
    },
    ['Name']:{
      type: Sequelize.STRING
    },
    ["Gender"]:{
      type: Sequelize.STRING
    },
    ['Contact Number']:{
      type: Sequelize.STRING
    },
    ['Age Group']:{
      type: Sequelize.STRING
    },
    ['Occupation']:{
      type: Sequelize.STRING
    },
    ['Caste Category']: {
      type: Sequelize.STRING
    },
    ['RCaste']:{
      type: Sequelize.STRING
    },
    ["Caste"]:{
      type: Sequelize.STRING
    },
    ['Constituency']:{
      type: Sequelize.STRING
    },
    ['Mandal Name']:{
        type: Sequelize.STRING 
    },
    ['Ward Number']:{
      type: Sequelize.STRING
    },
    ['Have you received any schemes from Government?']:{
      type: Sequelize.STRING
    },
    ['CM_Satisfaction']:{
      type: Sequelize.STRING
    },
    ['Party']:{
      type: Sequelize.STRING
    },
    ["MLA Satisfaction"]:{
      type: Sequelize.STRING
    },
    ['MLA Preference']:{
      type: Sequelize.STRING
    },
    ['Factor']:{
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
    ['Known Candidate']:{
        type: Sequelize.STRING 
    },
    ['Better Candidate']:{
      type: Sequelize.STRING
    },
    ['Known Candidate(TDP)']:{
      type: Sequelize.STRING
    },
    ['YSRCP Co-ordinator']:{
      type: Sequelize.STRING
    },
    ['Tirupathi Bye elections']:{
      type: Sequelize.STRING
    },
    ["If Not Why.?"]:{
      type: Sequelize.STRING
    },
    ['YSRCP-Best Candidate']:{
      type: Sequelize.STRING
    },
    ['TDP+JSP Alliance']:{
      type: Sequelize.STRING
    },
    ['TDP Full']:{
      type: Sequelize.STRING
    },
    ['JSP Full']:{
      type: Sequelize.STRING
    },
    ['TDP Candidate(Alliance)']:{
      type: Sequelize.STRING
    },
    ['JSP Candidate(Alliance)']:{
      type: Sequelize.STRING
    },
    ['TDP Candidate']:{
      type: Sequelize.STRING
    },
    ['JSP Candidate']:{
      type: Sequelize.STRING
    },
    ["TDP Candidate(Alliance)"]:{
      type: Sequelize.STRING
    },
    ['JSP Candidate(Alliance)']:{
      type: Sequelize.STRING
    },
    ['Week']:{
      type: Sequelize.STRING
    },
    ['Schemes Termination']:{
      type: Sequelize.STRING
    },
    Rev_Mandal:{
      type: Sequelize.STRING

    },
    sdate:{
      type: Sequelize.STRING
    }
  }, {
    timestamps: false
  })
  return  datasurvey 

}