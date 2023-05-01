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
        query = `
          SELECT
            t1.District,
            CONCAT(ROUND(((SUM(CASE WHEN Party = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
            CONCAT(ROUND(((SUM(CASE WHEN Party = 'TDP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS TDP,
            CONCAT(ROUND((((SUM(CASE WHEN Party = 'JSP' THEN Factor ELSE 0 END) + SUM(CASE WHEN Party = 'BJP' THEN Factor ELSE 0 END)) / SUM(Factor)) * 100)), '%') AS JSP_BJP,
            CONCAT(ROUND(((SUM(CASE WHEN Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS OTHER
          FROM fileddata AS t1
          JOIN (
            SELECT District,R_Constituency, Max(Week) AS Max_week
            FROM fileddata
            GROUP BY R_Constituency,District
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_week
          WHERE Party IS NOT NULL
          ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
          ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
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
        SELECT District,R_Constituency,PARLIAMENT, Max(Week) AS Max_week
        FROM fileddata
        GROUP BY District,R_Constituency,PARLIAMENT Order by Max_week DESC
      ) AS t2 ON t1.R_Constituency = t2.R_Constituency  AND t1.Week = t2.Max_week
      WHERE Party IS NOT NULL
      ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
      ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
      ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
      ${District ? `AND t1.District = '${District}'` : ''}
      ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
      GROUP BY t1.PARLIAMENT
      ORDER BY SUM(Factor) DESC;`; // Add the query for parliament here--------
      break;
    case 'RCaste':
        query = `SELECT
        t1.RCaste,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'TDP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS TDP,
        CONCAT(ROUND((((SUM(CASE WHEN Party = 'JSP' THEN Factor ELSE 0 END) + SUM(CASE WHEN Party = 'BJP' THEN Factor ELSE 0 END)) / SUM(Factor)) * 100)), '%') AS JSP_BJP,
        CONCAT(ROUND(((SUM(CASE WHEN Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS OTHER
    FROM (
        SELECT R_Constituency, RCaste, Week, Factor, Party
        FROM fileddata
         WHERE Party IS NOT NULL
          ${Gender ? `AND Gender = '${Gender}'` : ''}
          ${Caste ? `AND RCaste = '${Caste}'` : ''}
          ${age ? `AND \`Age Group\` = '${age}'` : ''}
          ${District ? `AND District = '${District}'` : ''}
          ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
    ) AS t1
    JOIN (
        SELECT R_Constituency, MAX(Week) AS Max_date
        FROM fileddata
         WHERE Party IS NOT NULL
          ${Gender ? `AND Gender = '${Gender}'` : ''}
          ${Caste ? `AND RCaste = '${Caste}'` : ''}
          ${age ? `AND \`Age Group\` = '${age}'` : ''}
          ${District ? `AND District = '${District}'` : ''}
          ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
        GROUP BY R_Constituency
    ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
    GROUP BY t1.RCaste
    ORDER BY SUM(Factor) DESC;
    `; // Add the query for caste here
      // ${Caste && Caste.length ? `AND Caste IN (${Caste.map(c => `'${c}'`).join(', ')})` : ''}
      break;
    default:
      res.send('Invalid option');
      return;
  }

  try {
    const data = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      order: [[selectedOption, 'ASC']] // Replace 'column_name' with the name of the column you want to sort by
    });
    res.send(data);
    // res.render('overviewpage', { "data ":data});
    // res.send(data)
    console.log(data)
  
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
      'SELECT DISTINCT RCaste FROM fileddata WHERE District = :district AND PARLIAMENT = :parliament',
      {
        replacements: { district: selectedDistrict, parliament:parliament},
        type: sequelize.QueryTypes.SELECT
      }
    );

    const Caste = results.map(result => result.RCaste);
    console.log('CASTE---',Caste.length)
    res.send(Caste);
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


const TDPJSPAlliance = async (req, res, next) => {
  const {selectedOption,Gender,Caste,age,District,PARLIAMENT} = req.body;
  let query = '';


  // Build the query based on the selected option
  switch (selectedOption) {
   
      case 'District':
        query = `
          SELECT
            t1.District,
            CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
            CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS \`Will Not Vote\`,
            CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS \`TDP+JSP\`
           
          FROM fileddata AS t1
          JOIN (
            SELECT District,R_Constituency, Max(Week) AS Max_week
            FROM fileddata
            GROUP BY R_Constituency,District
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_week
          WHERE \`TDP+JSP Alliance\` IS NOT NULL
          AND Party IN ('TDP', 'JSP')
          ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
          ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
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
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
            CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS \`Will Not Vote\`,
            CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS \`TDP+JSP\`
      FROM fileddata AS t1
      JOIN (
        SELECT PARLIAMENT, Max(Week) AS Max_week
        FROM fileddata
        GROUP BY PARLIAMENT
      ) AS t2 ON t1.PARLIAMENT = t2.PARLIAMENT AND t1.Week = t2.Max_week
      WHERE \`TDP+JSP Alliance\` IS NOT NULL
      AND Party IN ('TDP', 'JSP')
      ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
      ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
      ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
      ${District ? `AND t1.District = '${District}'` : ''}
      ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
      GROUP BY t1.PARLIAMENT
      ORDER BY SUM(Factor) DESC;`; // Add the query for parliament here--------
      break;
    case 'RCaste':
        query = `SELECT
        t1.RCaste,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
            CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS \`Will Not Vote\`,
            CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS \`TDP+JSP\`
            FROM (
              SELECT R_Constituency, RCaste, Week, Factor, \`TDP+JSP Alliance\`
              FROM fileddata
               WHERE \`TDP+JSP Alliance\` IS NOT NULL
               AND Party IN ('TDP', 'JSP')
                ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
                ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
                ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
                ${District ? `AND t1.District = '${District}'` : ''}
                ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
          ) AS t1
          JOIN (
              SELECT R_Constituency, MAX(Week) AS Max_date
              FROM fileddata
               WHERE \`TDP+JSP Alliance\` IS NOT NULL
               AND Party IN ('TDP', 'JSP')
                ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
                ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
                ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
                ${District ? `AND t1.District = '${District}'` : ''}
                ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
              GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
          GROUP BY t1.RCaste
          ORDER BY SUM(Factor) DESC;`; // Add the query for caste here
      // ${Caste && Caste.length ? `AND Caste IN (${Caste.map(c => `'${c}'`).join(', ')})` : ''}
      break;
    default:
      res.send('Invalid option');
      return;
  }

  try {
    const data = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      order: [[selectedOption, 'DESC']] // Replace 'column_name' with the name of the column you want to sort by
    });
    res.send(data);
    // res.render('overviewpage', { "data ":data});
    // res.send(data)
    // console.log(data)
  
  } catch (error) {
    console.error(error);
    res.send("Error occurred while fetching data");
  }
}
const getDistCaste = async(req,res,next)=>{
  const selectedDistrict = req.query.District;
  // const parliament = req.query.parliament;
  
  try {
    let query = 'SELECT DISTINCT RCaste FROM fileddata WHERE District = :district';
    let replacements = { district: selectedDistrict };
    
   
    
    const results = await db.sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const Caste = results.map(result => result.RCaste);
    console.log(Caste.length)
    res.send(Caste);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


module.exports = {
    DPC_data,
    Parliament,
    getCaste,
    TDPJSPAlliance,
    getDistCaste
  };
  


