const sequelize  = require('sequelize')
const { QueryTypes } = require('sequelize');
const nodeify = require('nodeify');
const CsvParser = require("json2csv").Parser;
const db = require("../../models");
const PD_data = db.PD_data;
const _ = require('lodash');




// const XLSX = require("read-excel-file/node");
// const ivrs = require("../../models/ivrs.model");
// const excel = require('fast-xlsx-reader');
const reader = require('xlsx');

const excel = require("exceljs");

const fs = require("fs");


const DPC_data = async (req, res, next) => {
  const {selectedOption,Gender,Caste,age,District,PARLIAMENT} = req.body;
  let query = '';


  // Build the query based on the selected option
  switch (selectedOption) {
    case 'District':
      case 'District':
        query = `
          SELECT
            t1.District,
            CONCAT(ROUND(((SUM(CASE WHEN Party = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
            CONCAT(ROUND(((SUM(CASE WHEN Party = 'TDP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS TDP,
            CONCAT(ROUND((((SUM(CASE WHEN Party = 'JSP' THEN Factor ELSE 0 END) + SUM(CASE WHEN Party = 'BJP' THEN Factor ELSE 0 END)) / SUM(Factor)) * 100)), '%') AS JSP_BJP,
            CONCAT(ROUND(((SUM(CASE WHEN Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS OTHER
          FROM fileddata AS t1
          JOIN (
            SELECT District,R_Constituency, MAX(Week) AS Max_week
            FROM fileddata
            GROUP BY R_Constituency,District
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_week
          WHERE Party IS NOT NULL
          ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
          ${Caste ? `AND t1.Caste = '${Caste}'` : ''}
          ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
          ${District ? `AND t1.District = '${District}'` : ''}
          ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
          GROUP BY t1.District
          ORDER BY SUM(Factor) DESC;
        `;// Add the query for districts here
      break;
    case 'PARLIAMENT':
        query = `SELECT
        t1.PARLIAMENT,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'TDP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS TDP,
        CONCAT(ROUND((((SUM(CASE WHEN Party = 'JSP' THEN Factor ELSE 0 END) + SUM(CASE WHEN Party = 'BJP' THEN Factor ELSE 0 END)) / SUM(Factor)) * 100)), '%') AS JSP_BJP,
        CONCAT(ROUND(((SUM(CASE WHEN Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS OTHER
      FROM fileddata AS t1
      JOIN (
        SELECT District,R_Constituency, MAX(Week) AS Max_week
        FROM fileddata
        GROUP BY R_Constituency,District
      ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_week
      WHERE Party IS NOT NULL
      ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
      ${Caste ? `AND t1.Caste = '${Caste}'` : ''}
      ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
      ${District ? `AND t1.District = '${District}'` : ''}
      ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
      GROUP BY t1.PARLIAMENT
      ORDER BY SUM(Factor) DESC;`; // Add the query for parliament here--------
      break;
    case 'Caste':
        query = `SELECT
        t1.Caste,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'TDP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS TDP,
        CONCAT(ROUND((((SUM(CASE WHEN Party = 'JSP' THEN Factor ELSE 0 END) + SUM(CASE WHEN Party = 'BJP' THEN Factor ELSE 0 END)) / SUM(Factor)) * 100)), '%') AS JSP_BJP,
        CONCAT(ROUND(((SUM(CASE WHEN Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS OTHER
      FROM fileddata AS t1
      JOIN (
        SELECT District,R_Constituency, MAX(Week) AS Max_week
        FROM fileddata
        GROUP BY R_Constituency,District
      ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_week
      WHERE Party IS NOT NULL
      ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
      ${Caste ? `AND t1.Caste = '${Caste}'` : ''}
      ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
      ${District ? `AND t1.District = '${District}'` : ''}
      ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
      GROUP BY t1.Caste
      ORDER BY SUM(Factor) DESC;`; // Add the query for caste here
      // ${Caste && Caste.length ? `AND Caste IN (${Caste.map(c => `'${c}'`).join(', ')})` : ''}
      break;
    default:
      res.send('Invalid option');
      return;
  }

  try {
    const data = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });
    // res.render('overviewpage', { "data ":data});
    // res.send(data)
    console.log(data)
    res.send(data)
  } catch (error) {
    console.error(error);
    res.send("Error occurred while fetching data");
  }
}

const  Parliament =async(req, res, next)=>{

  const selectedDistrict = req.query.District;
  // const parliament = req.query.Parliament

  // console.log('district',selectedDistrict)
  try {
    const results = await db.sequelize.query(                            
      'SELECT DISTINCT PARLIAMENT FROM fileddata WHERE District = :district ',
      {
        replacements: { district: selectedDistrict },
        type: sequelize.QueryTypes.SELECT
      }
    );

    const Parliaments = results.map(result => result.PARLIAMENT);
    // console.log(Parliaments)
    res.json(Parliaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error..' });
  }
}
const getCaste = async(req,res,next)=>{
  const selectedDistrict = req.query.District
  const parliament = req.query.parliament
  
  try {
    const results = await db.sequelize.query(
      'SELECT DISTINCT Caste FROM fileddata WHERE District = :district AND PARLIAMENT = :parliament',
      {
        replacements: { district: selectedDistrict, parliament:parliament},
        type: sequelize.QueryTypes.SELECT
      }
    );

    const Caste = results.map(result => result.Caste);
    // console.log('CASTE---',Caste)
    res.send(Caste);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
module.exports = {
    DPC_data,
    Parliament,
    getCaste
  };
  


