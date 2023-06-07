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
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100),0), '%') AS YSRCP,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'TDP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100),0), '%') AS TDP,
        CONCAT(ROUND((((SUM(CASE WHEN Party = 'JSP' THEN Factor ELSE 0 END) + SUM(CASE WHEN Party = 'BJP' THEN Factor ELSE 0 END)) / SUM(Factor)) * 100),0), '%') AS JSP_BJP,
        CONCAT(ROUND(((SUM(CASE WHEN Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN Factor ELSE 0 END) / SUM(Factor)) * 100),0), '%') AS OTHER
    FROM (
        SELECT R_Constituency, District, Week, Factor, Party
        FROM fileddata
         WHERE Party IS NOT NULL
         And SET_F='Consider'
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
         And SET_F='Consider'
          ${Gender ? `AND Gender = '${Gender}'` : ''}
          ${Caste ? `AND RCaste = '${Caste}'` : ''}
          ${age ? `AND \`Age Group\` = '${age}'` : ''}
          ${District ? `AND District = '${District}'` : ''}
          ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
        GROUP BY R_Constituency
    ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
    GROUP BY t1.District
    ORDER BY 
      CASE 
        WHEN District = 'SRIKAKULAM' THEN 1 
        WHEN District = 'VIZIANAGARAM' THEN 2 
        WHEN District = 'VISAKHAPATNAM' THEN 3
        WHEN District = 'EAST GODAVARI' THEN 4 
        WHEN District = 'WEST GODAVARI' THEN 5
        WHEN District = 'KRISHNA' THEN 6 
        WHEN District = 'GUNTUR' THEN 7
        WHEN District = 'PRAKASAM' THEN 8 
        WHEN District = 'NELLORE' THEN 9
        WHEN District = 'KADAPA' THEN 10 
        WHEN District = 'KURNOOL' THEN 11
        WHEN District = 'CHITTOOR' THEN 12
        ELSE 13 
      END;
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
        SELECT R_Constituency,PARLIAMENT
        FROM fileddata
        GROUP BY R_Constituency,PARLIAMENT 
      ) AS t2 ON t1.R_Constituency = t2.R_Constituency  
      WHERE Party IS NOT NULL
      And SET_F='Consider'
      ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
      ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
      ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
      ${District ? `AND t1.District = '${District}'` : ''}
      ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
      GROUP BY t1.PARLIAMENT
      ORDER BY 
      CASE 
      WHEN t1.PARLIAMENT = 'SRIKAKULAM' THEN 1 
      WHEN t1.PARLIAMENT = 'VIZIANAGARAM' THEN 2 
      WHEN t1.PARLIAMENT = 'VISAKHAPATNAM' THEN 3
      WHEN t1.PARLIAMENT = 'ANAKAPALLI' THEN 4 
      WHEN t1.PARLIAMENT = 'ARAKU' THEN 5
      WHEN t1.PARLIAMENT = 'AMALAPURAM' THEN 6 
      WHEN t1.PARLIAMENT = 'KAKINADA' THEN 7
      WHEN t1.PARLIAMENT = 'RAJAHMUNDRY' THEN 8 
      WHEN t1.PARLIAMENT = 'NARASAPURAM' THEN 9
      WHEN t1.PARLIAMENT = 'ELURU' THEN 10 
      WHEN t1.PARLIAMENT = 'MACHILIPATNAM' THEN 11
      WHEN t1.PARLIAMENT = 'VIJAYAWADA' THEN 12
      WHEN t1.PARLIAMENT = 'GUNTUR' THEN 13 
      WHEN t1.PARLIAMENT = 'NARASARAOPETA' THEN 14 
      WHEN t1.PARLIAMENT = 'BAPATLA' THEN 15
      WHEN t1.PARLIAMENT = 'ONGOLE' THEN 16
      WHEN t1.PARLIAMENT = 'NELLORE' THEN 17
      WHEN t1.PARLIAMENT = 'TIRUPATHI' THEN 18 
      WHEN t1.PARLIAMENT = 'KADAPA' THEN 19
      WHEN t1.PARLIAMENT = 'RAJAMPET' THEN 20 
      WHEN t1.PARLIAMENT = 'KURNOOL' THEN 21
      WHEN t1.PARLIAMENT = 'NANDYAL' THEN 22 
      WHEN t1.PARLIAMENT = 'CHITTOOR' THEN 23
      WHEN t1.PARLIAMENT = 'HINDUPUR' THEN 24
      ELSE 25 
    END;`; // Add the query for parliament here--------
      break;
    case 'RCaste':
        query = `SELECT
        t1.RCaste As Caste,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'YSRCP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS YSRCP,
        CONCAT(ROUND(((SUM(CASE WHEN Party = 'TDP' THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS TDP,
        CONCAT(ROUND((((SUM(CASE WHEN Party = 'JSP' THEN Factor ELSE 0 END) + SUM(CASE WHEN Party = 'BJP' THEN Factor ELSE 0 END)) / SUM(Factor)) * 100)), '%') AS JSP_BJP,
        CONCAT(ROUND(((SUM(CASE WHEN Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN Factor ELSE 0 END) / SUM(Factor)) * 100)), '%') AS OTHER
    FROM (
        SELECT R_Constituency, RCaste, Week, Factor, Party
        FROM fileddata
         WHERE Party IS NOT NULL
         And SET_F='Consider'
          ${Gender ? `AND Gender = '${Gender}'` : ''}
          ${Caste ? `AND RCaste = '${Caste}'` : ''}
          ${age ? `AND \`Age Group\` = '${age}'` : ''}
          ${District ? `AND District = '${District}'` : ''}
          ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
    ) AS t1
    JOIN (
        SELECT R_Constituency
        FROM fileddata
         WHERE Party IS NOT NULL
         And SET_F='Consider'
          ${Gender ? `AND Gender = '${Gender}'` : ''}
          ${Caste ? `AND RCaste = '${Caste}'` : ''}
          ${age ? `AND \`Age Group\` = '${age}'` : ''}
          ${District ? `AND District = '${District}'` : ''}
          ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
        GROUP BY R_Constituency
    ) AS t2 ON t1.R_Constituency = t2.R_Constituency 
    GROUP BY Caste
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
      'SELECT DISTINCT PARLIAMENT FROM fileddata WHERE District = :district ORDER BY PARLIAMENT ASC;' ,
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
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS YSRCP,
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS 'TDP+JSP',
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS Will_Not_Vote,
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`YSRCP.\`,
   
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`TDP+JSP.\`,
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS 'Will Not Vote',
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`.YSRCP\`,
    
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`.TDP+JSP\`,
    CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`Will_Not_Vote.\`
           
          FROM fileddata AS t1
          JOIN (
            SELECT District,R_Constituency, Max(Week) AS Max_week
            FROM fileddata
            GROUP BY R_Constituency,District
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_week
          WHERE \`TDP+JSP Alliance\` IS NOT NULL
          And SET_F='Consider'
          ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
          ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
          ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
          ${District ? `AND t1.District = '${District}'` : ''}
          ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
          GROUP BY t1.District
          ORDER BY 
      CASE 
        WHEN t1.District = 'SRIKAKULAM' THEN 1 
        WHEN t1.District = 'VIZIANAGARAM' THEN 2 
        WHEN t1.District = 'VISAKHAPATNAM' THEN 3
        WHEN t1.District = 'EAST GODAVARI' THEN 4 
        WHEN t1.District = 'WEST GODAVARI' THEN 5
        WHEN t1.District = 'KRISHNA' THEN 6 
        WHEN t1.District = 'GUNTUR' THEN 7
        WHEN t1.District = 'PRAKASAM' THEN 8 
        WHEN t1.District = 'NELLORE' THEN 9
        WHEN t1.District = 'KADAPA' THEN 10 
        WHEN t1.District = 'KURNOOL' THEN 11
        WHEN t1.District = 'CHITTOOR' THEN 12
        ELSE 13 
      END;
        `;// Add the query for districts here
      break;
    case 'PARLIAMENT':
        query = `SELECT
        t1.PARLIAMENT,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS YSRCP,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS 'TDP+JSP',
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS Will_Not_Vote,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`YSRCP.\`,
       
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`TDP+JSP.\`,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS 'Will Not Vote',
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`.YSRCP\`,
        
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`.TDP+JSP\`,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`Will_Not_Vote.\`
            FROM (
              SELECT R_Constituency, PARLIAMENT, Week, Factor, \`TDP+JSP Alliance\`,Party
              FROM fileddata
               WHERE \`TDP+JSP Alliance\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
          ) AS t1
          JOIN (
              SELECT R_Constituency, MAX(Week) AS Max_date
              FROM fileddata
               WHERE \`TDP+JSP Alliance\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
              GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
          GROUP BY t1.PARLIAMENT
          ORDER BY 
      CASE 
      WHEN t1.PARLIAMENT = 'SRIKAKULAM' THEN 1 
      WHEN t1.PARLIAMENT = 'VIZIANAGARAM' THEN 2 
      WHEN t1.PARLIAMENT = 'VISAKHAPATNAM' THEN 3
      WHEN t1.PARLIAMENT = 'ANAKAPALLI' THEN 4 
      WHEN t1.PARLIAMENT = 'ARAKU' THEN 5
      WHEN t1.PARLIAMENT = 'AMALAPURAM' THEN 6 
      WHEN t1.PARLIAMENT = 'KAKINADA' THEN 7
      WHEN t1.PARLIAMENT = 'RAJAHMUNDRY' THEN 8 
      WHEN t1.PARLIAMENT = 'NARASAPURAM' THEN 9
      WHEN t1.PARLIAMENT = 'ELURU' THEN 10 
      WHEN t1.PARLIAMENT = 'MACHILIPATNAM' THEN 11
      WHEN t1.PARLIAMENT = 'VIJAYAWADA' THEN 12
      WHEN t1.PARLIAMENT = 'GUNTUR' THEN 13 
      WHEN t1.PARLIAMENT = 'NARASARAOPETA' THEN 14 
      WHEN t1.PARLIAMENT = 'BAPATLA' THEN 15
      WHEN t1.PARLIAMENT = 'ONGOLE' THEN 16
      WHEN t1.PARLIAMENT = 'NELLORE' THEN 17
      WHEN t1.PARLIAMENT = 'TIRUPATHI' THEN 18 
      WHEN t1.PARLIAMENT = 'KADAPA' THEN 19
      WHEN t1.PARLIAMENT = 'RAJAMPET' THEN 20 
      WHEN t1.PARLIAMENT = 'KURNOOL' THEN 21
      WHEN t1.PARLIAMENT = 'NANDYAL' THEN 22 
      WHEN t1.PARLIAMENT = 'CHITTOOR' THEN 23
      WHEN t1.PARLIAMENT = 'HINDUPUR' THEN 24
      ELSE 25 
    END;`; // Add the query for parliament here--------
      break;
    case 'RCaste':
        query = `SELECT
        t1.RCaste AS Caste,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS YSRCP,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS 'TDP+JSP',
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party IN ('TDP', 'JSP') THEN Factor ELSE 0 END)) * 100)), '%') AS Will_Not_Vote,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`YSRCP.\`,
       
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`TDP+JSP.\`,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party = 'TDP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'TDP' THEN Factor ELSE 0 END)) * 100)), '%') AS 'Will Not Vote',
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'YSRCP' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`.YSRCP\`,
        
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'TDP+JSP' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`.TDP+JSP\`,
        CONCAT(ROUND(((SUM(CASE WHEN \`TDP+JSP Alliance\` = 'Will Not Vote' AND t1.Party = 'JSP' THEN Factor ELSE 0 END) / SUM(CASE WHEN t1.Party = 'JSP' THEN Factor ELSE 0 END)) * 100)), '%') AS \`Will_Not_Vote.\`
        
            FROM (
              SELECT R_Constituency, RCaste, Week, Factor, \`TDP+JSP Alliance\`,Party,SET_F
              FROM fileddata
               WHERE \`TDP+JSP Alliance\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
          ) AS t1
          JOIN (
              SELECT R_Constituency, MAX(Week) AS Max_date
              FROM fileddata
               WHERE \`TDP+JSP Alliance\` IS NOT NULL
               And SET_F='Consider'
               
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
              GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
          GROUP BY Caste 
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



// for TDP FULL 
const TDPFull= async (req, res, next) => {
  const {selectedOption,Gender,Caste,age,District,PARLIAMENT} = req.body;
  let query = '';


  // Build the query based on the selected option
  switch (selectedOption) {
   
      case 'District':
        query = `
          SELECT
            t1.District,
            CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'YSRCP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'YSRCP',
            CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\`='TDP+JSP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'TDP+JSP',
            
            CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'BJP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'BJP',
            CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'INC' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'INC',
            CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'Will not Vote' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Will not Vote',
            CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'Not Decided' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Not Decided'
           
          FROM fileddata AS t1
          JOIN (
            SELECT R_Constituency
            FROM fileddata
            GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency 
          WHERE \`TDP Full\` IS NOT NULL
          And SET_F='Consider'
          ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
          ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
          ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
          ${District ? `AND t1.District = '${District}'` : ''}
          ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
          GROUP BY t1.District
          ORDER BY 
      CASE 
        WHEN t1.District = 'SRIKAKULAM' THEN 1 
        WHEN t1.District = 'VIZIANAGARAM' THEN 2 
        WHEN t1.District = 'VISAKHAPATNAM' THEN 3
        WHEN t1.District = 'EAST GODAVARI' THEN 4 
        WHEN t1.District = 'WEST GODAVARI' THEN 5
        WHEN t1.District = 'KRISHNA' THEN 6 
        WHEN t1.District = 'GUNTUR' THEN 7
        WHEN t1.District = 'PRAKASAM' THEN 8 
        WHEN t1.District = 'NELLORE' THEN 9
        WHEN t1.District = 'KADAPA' THEN 10 
        WHEN t1.District = 'KURNOOL' THEN 11
        WHEN t1.District = 'CHITTOOR' THEN 12
        ELSE 13 
      END;
        `;// Add the query for districts here
      break;
    case 'PARLIAMENT':
        query = `SELECT
        t1.PARLIAMENT,
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\`='TDP+JSP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'TDP+JSP',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'YSRCP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'YSRCP',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'BJP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'BJP',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'INC' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'INC',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'Will not Vote' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Will not Vote',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'Not Decided' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Not Decided'
            FROM (
              SELECT R_Constituency, PARLIAMENT, Week, Factor, \`TDP Full\`,Party
              FROM fileddata
               WHERE \`TDP Full\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
          ) AS t1
          JOIN (
              SELECT R_Constituency, MAX(Week) AS Max_date
              FROM fileddata
               WHERE \`TDP Full\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
              GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
          GROUP BY t1.PARLIAMENT
          ORDER BY 
      CASE 
      WHEN t1.PARLIAMENT = 'SRIKAKULAM' THEN 1 
      WHEN t1.PARLIAMENT = 'VIZIANAGARAM' THEN 2 
      WHEN t1.PARLIAMENT = 'VISAKHAPATNAM' THEN 3
      WHEN t1.PARLIAMENT = 'ANAKAPALLI' THEN 4 
      WHEN t1.PARLIAMENT = 'ARAKU' THEN 5
      WHEN t1.PARLIAMENT = 'AMALAPURAM' THEN 6 
      WHEN t1.PARLIAMENT = 'KAKINADA' THEN 7
      WHEN t1.PARLIAMENT = 'RAJAHMUNDRY' THEN 8 
      WHEN t1.PARLIAMENT = 'NARASAPURAM' THEN 9
      WHEN t1.PARLIAMENT = 'ELURU' THEN 10 
      WHEN t1.PARLIAMENT = 'MACHILIPATNAM' THEN 11
      WHEN t1.PARLIAMENT = 'VIJAYAWADA' THEN 12
      WHEN t1.PARLIAMENT = 'GUNTUR' THEN 13 
      WHEN t1.PARLIAMENT = 'NARASARAOPETA' THEN 14 
      WHEN t1.PARLIAMENT = 'BAPATLA' THEN 15
      WHEN t1.PARLIAMENT = 'ONGOLE' THEN 16
      WHEN t1.PARLIAMENT = 'NELLORE' THEN 17
      WHEN t1.PARLIAMENT = 'TIRUPATHI' THEN 18 
      WHEN t1.PARLIAMENT = 'KADAPA' THEN 19
      WHEN t1.PARLIAMENT = 'RAJAMPET' THEN 20 
      WHEN t1.PARLIAMENT = 'KURNOOL' THEN 21
      WHEN t1.PARLIAMENT = 'NANDYAL' THEN 22 
      WHEN t1.PARLIAMENT = 'CHITTOOR' THEN 23
      WHEN t1.PARLIAMENT = 'HINDUPUR' THEN 24
      ELSE 25 
    END;`; // Add the query for parliament here--------
      break;
    case 'RCaste':
        query = `SELECT
        t1.RCaste As Caste,
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\`='TDP+JSP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'TDP+JSP',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'YSRCP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'YSRCP',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'BJP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'BJP',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'INC' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'INC',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'Will not Vote' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Will not Vote',
        CONCAT(FORMAT(SUM(CASE WHEN \`TDP Full\` = 'Not Decided' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Not Decided'
            FROM (
              SELECT R_Constituency, RCaste, Week, Factor, \`TDP Full\`,Party
              FROM fileddata
               WHERE \`TDP Full\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
          ) AS t1
          JOIN (
              SELECT R_Constituency, MAX(Week) AS Max_date
              FROM fileddata
               WHERE \`TDP Full\` IS NOT NULL
               And SET_F='Consider'
               
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
              GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
          GROUP BY Caste
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


const JSPFull= async (req, res, next) => {
  const {selectedOption,Gender,Caste,age,District,PARLIAMENT} = req.body;
  let query = '';


  // Build the query based on the selected option
  switch (selectedOption) {
   
      case 'District':
        query = `
          SELECT
            t1.District,
 CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\`='TDP+JSP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'TDP+JSP',
 CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'YSRCP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'YSRCP',
 CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'BJP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'BJP',
 CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'INC' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'INC',
 CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'Will not Vote' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Will not Vote',
 CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'Not Decided' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Not Decided'
           
          FROM fileddata AS t1
          JOIN (
            SELECT R_Constituency
            FROM fileddata
            GROUP BY R_Constituency,District
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency 
          WHERE \`JSP Full\` IS NOT NULL
          And SET_F='Consider'
          ${Gender ? `AND t1.Gender = '${Gender}'` : ''}
          ${Caste ? `AND t1.RCaste = '${Caste}'` : ''}
          ${age ? `AND t1.\`Age Group\` = '${age}'` : ''}
          ${District ? `AND t1.District = '${District}'` : ''}
          ${PARLIAMENT ? `AND t1.PARLIAMENT = '${PARLIAMENT}'` : ''}
          GROUP BY t1.District
          ORDER BY 
      CASE 
        WHEN t1.District = 'SRIKAKULAM' THEN 1 
        WHEN t1.District = 'VIZIANAGARAM' THEN 2 
        WHEN t1.District = 'VISAKHAPATNAM' THEN 3
        WHEN t1.District = 'EAST GODAVARI' THEN 4 
        WHEN t1.District = 'WEST GODAVARI' THEN 5
        WHEN t1.District = 'KRISHNA' THEN 6 
        WHEN t1.District = 'GUNTUR' THEN 7
        WHEN t1.District = 'PRAKASAM' THEN 8 
        WHEN t1.District = 'NELLORE' THEN 9
        WHEN t1.District = 'KADAPA' THEN 10 
        WHEN t1.District = 'KURNOOL' THEN 11
        WHEN t1.District = 'CHITTOOR' THEN 12
        ELSE 13 
      END;
        `;// Add the query for districts here
      break;
    case 'PARLIAMENT':
        query = `SELECT
        t1.PARLIAMENT,
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\`='TDP+JSP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'TDP+JSP',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'YSRCP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'YSRCP',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'BJP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'BJP',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'INC' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'INC',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'Will not Vote' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Will not Vote',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'Not Decided' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Not Decided'
            FROM (
              SELECT R_Constituency, PARLIAMENT, Week, Factor, \`JSP Full\`,Party
              FROM fileddata
               WHERE \`JSP Full\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
          ) AS t1
          JOIN (
              SELECT R_Constituency, MAX(Week) AS Max_date
              FROM fileddata
               WHERE \`JSP Full\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
              GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
          GROUP BY t1.PARLIAMENT
          ORDER BY 
      CASE 
      WHEN t1.PARLIAMENT = 'SRIKAKULAM' THEN 1 
      WHEN t1.PARLIAMENT = 'VIZIANAGARAM' THEN 2 
      WHEN t1.PARLIAMENT = 'VISAKHAPATNAM' THEN 3
      WHEN t1.PARLIAMENT = 'ANAKAPALLI' THEN 4 
      WHEN t1.PARLIAMENT = 'ARAKU' THEN 5
      WHEN t1.PARLIAMENT = 'AMALAPURAM' THEN 6 
      WHEN t1.PARLIAMENT = 'KAKINADA' THEN 7
      WHEN t1.PARLIAMENT = 'RAJAHMUNDRY' THEN 8 
      WHEN t1.PARLIAMENT = 'NARASAPURAM' THEN 9
      WHEN t1.PARLIAMENT = 'ELURU' THEN 10 
      WHEN t1.PARLIAMENT = 'MACHILIPATNAM' THEN 11
      WHEN t1.PARLIAMENT = 'VIJAYAWADA' THEN 12
      WHEN t1.PARLIAMENT = 'GUNTUR' THEN 13 
      WHEN t1.PARLIAMENT = 'NARASARAOPETA' THEN 14 
      WHEN t1.PARLIAMENT = 'BAPATLA' THEN 15
      WHEN t1.PARLIAMENT = 'ONGOLE' THEN 16
      WHEN t1.PARLIAMENT = 'NELLORE' THEN 17
      WHEN t1.PARLIAMENT = 'TIRUPATHI' THEN 18 
      WHEN t1.PARLIAMENT = 'KADAPA' THEN 19
      WHEN t1.PARLIAMENT = 'RAJAMPET' THEN 20 
      WHEN t1.PARLIAMENT = 'KURNOOL' THEN 21
      WHEN t1.PARLIAMENT = 'NANDYAL' THEN 22 
      WHEN t1.PARLIAMENT = 'CHITTOOR' THEN 23
      WHEN t1.PARLIAMENT = 'HINDUPUR' THEN 24
      ELSE 25 
    END;`; // Add the query for parliament here--------
      break;
    case 'RCaste':
        query = `SELECT
        t1.RCaste As Caste,
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\`='TDP+JSP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'TDP+JSP',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'YSRCP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'YSRCP',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'BJP' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'BJP',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'INC' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'INC',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'Will not Vote' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Will not Vote',
        CONCAT(FORMAT(SUM(CASE WHEN \`JSP Full\` = 'Not Decided' THEN Factor ELSE 0 END)/SUM(Factor)*100, 1), '%') AS 'Not Decided'
            FROM (
              SELECT R_Constituency, RCaste, Week, Factor, \`JSP Full\`,Party
              FROM fileddata
               WHERE \`JSP Full\` IS NOT NULL
               And SET_F='Consider'
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
          ) AS t1
          JOIN (
              SELECT R_Constituency, MAX(Week) AS Max_date
              FROM fileddata
               WHERE \`JSP Full\` IS NOT NULL
               And SET_F='Consider'
               
                ${Gender ? `AND Gender = '${Gender}'` : ''}
                ${Caste ? `AND RCaste = '${Caste}'` : ''}
                ${age ? `AND \`Age Group\` = '${age}'` : ''}
                ${District ? `AND District = '${District}'` : ''}
                ${PARLIAMENT ? `AND PARLIAMENT = '${PARLIAMENT}'` : ''}
              GROUP BY R_Constituency
          ) AS t2 ON t1.R_Constituency = t2.R_Constituency AND t1.Week = t2.Max_date
          GROUP BY Caste
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


// For JSP FULL 

module.exports = {
    DPC_data,
    Parliament,
    getCaste,
    TDPJSPAlliance,
    getDistCaste,
    TDPFull,
    JSPFull
  };
  


