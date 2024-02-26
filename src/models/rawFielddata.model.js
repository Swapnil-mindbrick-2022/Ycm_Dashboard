
const Sequelize = require('sequelize')
// const sequelize = require('../database')
// const ivrs = require('./ivrs.model')
module.exports = (sequelize, Sequelize) => {
  const rawFieldData = sequelize.define("raw_fileddata",{
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
    ['Week']:{
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
    ['Surveyor_Name']:{
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

    ['Monthly Income']:{
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
    // ['Have you received any schemes from Government?']:{
    //   type: Sequelize.STRING
    // },
    ['CM_Satisfaction']:{
      type: Sequelize.STRING
    },
    ['Party']:{
      type: Sequelize.STRING
    },
    ['TDP+JSP Alliance']:{
        type: Sequelize.STRING
      },
      ['TDP Candidate(Alliance)']:{
        type: Sequelize.STRING
      },
      ['JSP Candidate(Alliance)']:{
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

    ['YSRCP Co-ordinator']:{
      type: Sequelize.STRING
    },
   
    ['2024_Candidate']:{
      type: Sequelize.STRING
    },
    ['Schemes Termination']:{
        type: Sequelize.STRING
      },
   
    ['TDP Full']:{
      type: Sequelize.STRING
    },
    ['JSP Full']:{
      type: Sequelize.STRING
    },
  

  
  
  }, {
    timestamps: false
  })
  return  rawFieldData 

}