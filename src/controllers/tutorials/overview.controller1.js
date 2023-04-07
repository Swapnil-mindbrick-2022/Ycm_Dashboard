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

const excel = require("exceljs")

const fs = require("fs");


const DPC_data = async (req, res, next) => {
  const selectedOption = req.query.selectedOption;
  let query = '';

  // Build the query based on the selected option
  switch (selectedOption) {
    case 'District':
        query = `SELECT 
        District, 
        concat(round(((SUM(CASE WHEN \`Party\` = 'YSRCP' THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS YSRCP,
        concat(round(((SUM(CASE WHEN \`Party\` = 'TDP' THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS TDP,
        concat(round((((SUM(CASE WHEN \`Party\` = 'JSP' THEN Factor ELSE 0 END)+SUM(CASE WHEN \`Party\` = 'BJP' THEN Factor ELSE 0 END)) / sum(Factor)) * 100)),'%') AS JSP_BJP,
        concat(round(((SUM(CASE WHEN \`Party\`  not in ('TDP','YSRCP','JSP','BJP') THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS OTHER
      FROM fileddata
      WHERE \`Party\` IS NOT NULL
      GROUP BY
      District;`; // Add the query for districts here
      break;
    case 'PARLIAMENT':
        query = `SELECT 
        PARLIAMENT, 
        concat(round(((SUM(CASE WHEN \`Party\` = 'YSRCP' THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS YSRCP,
        concat(round(((SUM(CASE WHEN \`Party\` = 'TDP' THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS TDP,
        concat(round((((SUM(CASE WHEN \`Party\` = 'JSP' THEN Factor ELSE 0 END)+SUM(CASE WHEN \`Party\` = 'BJP' THEN Factor ELSE 0 END)) / sum(Factor)) * 100)),'%') AS JSP_BJP,
        concat(round(((SUM(CASE WHEN \`Party\`  not in ('TDP','YSRCP','JSP','BJP') THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS OTHER
      FROM fileddata
      WHERE \`Party\` IS NOT NULL
      GROUP BY
      PARLIAMENT;`; // Add the query for parliament here
      break;
    case 'Caste':
        query = `SELECT 
        Caste, 
        concat(round(((SUM(CASE WHEN \`Party\` = 'YSRCP' THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS YSRCP,
        concat(round(((SUM(CASE WHEN \`Party\` = 'TDP' THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS TDP,
        concat(round((((SUM(CASE WHEN \`Party\` = 'JSP' THEN Factor ELSE 0 END)+SUM(CASE WHEN \`Party\` = 'BJP' THEN Factor ELSE 0 END)) / sum(Factor)) * 100)),'%') AS JSP_BJP,
        concat(round(((SUM(CASE WHEN \`Party\`  not in ('TDP','YSRCP','JSP','BJP') THEN Factor ELSE 0 END) / sum(Factor)) * 100)),'%') AS OTHER
      FROM fileddata
      WHERE \`Party\` IS NOT NULL
      GROUP BY
      Caste;`; // Add the query for caste here
      break;
    default:
      res.send('Invalid option');
      return;
  }

  try {
    const data = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.SELECT });
    // res.render('overviewpage', { "data ":data});
    // res.send(data)
    res.json(data)
  } catch (error) {
    console.error(error);
    res.send("Error occurred while fetching data");
  }
}












module.exports = {
    DPC_data,
  
  };
  


