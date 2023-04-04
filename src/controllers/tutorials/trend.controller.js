const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const nodeify = require('nodeify');
const CsvParser = require("json2csv").Parser;
const db = require("../../models");
const FiledData = db.fileddata;
const Trenddata = db.Trenddata;
const _ = require('lodash');

const reader = require('xlsx');
const excel = require("exceljs");
const fs = require("fs");
const { Op } = require('sequelize');


const DISTRICT_PARLIMENT = async (req, res, next) => {
    try {
      const { selectedOption } = req.query;
      let districtOrParliament = '';
  
      if (selectedOption.toUpperCase() === 'DISTRICT') {
        districtOrParliament = 'District';
      } else if (selectedOption.toUpperCase() === 'PARLIAMENT') {
        districtOrParliament = 'Parliament';
      } else {
        res.status(400).send('Invalid selectedOption');
        return;
      }
  
      const results = await db.sequelize.query(
        `SELECT DISTINCT ${districtOrParliament} FROM fileddata`
      );
  
      const districtsOrParliaments = results[0].map(
        (result) => result[districtOrParliament]
      );
  
      res.json(districtsOrParliaments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };



  //Trand Axis Chart 
  const TrendReport = async (req, res, next) => {
    try {
      const { selectedOption, DisParllimnet } = req.body;
  
      let whereClause = '';
      if (selectedOption === 'District') {
        whereClause += `fileddata.District = '${DisParllimnet}' `;
      } else if (selectedOption === 'PARLIAMENT') {
        whereClause += `fileddata.PARLIAMENT = '${DisParllimnet}' `;
      }
  
      const constituenciesQuery = `
        SELECT DISTINCT CONSTITUENCY FROM Trenddata
      `;
      const constituenciesResult = await db.sequelize.query(constituenciesQuery);
      const constituencies = constituenciesResult[0].map(constituency => constituency.Constituency);
  
      const partiesQuery = `
        SELECT DISTINCT Party FROM fileddata
      `;
      const partiesResult = await db.sequelize.query(partiesQuery);
      const parties = partiesResult[0].map(party => party.Party);
  
      const partyColumns = parties.map(party => {
        return `CONCAT(ROUND((SUM(CASE WHEN fileddata.Party = '${party}' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2),'%') AS \`${party}\``;
      }).join(',');
  
      const query = `
        SELECT 
          fileddata.\`R_Constituency\`,
          Trenddata.\`2019_YSRCP\` AS \`2019 YSRCP\`,
          Trenddata.\`2019_TDP\` AS \`2019 TDP\`,
          Trenddata.\`2019_JSP\` AS \`2019 JSP\`,
         
          Trenddata.\`2019_OTHERS\` AS \`2019_OTHERS\`,
          ${partyColumns}
        FROM Trenddata
        LEFT JOIN fileddata ON Trenddata.\`CONSTITUENCY\` = fileddata.\`R_Constituency\`
        WHERE ${whereClause}
        GROUP BY fileddata.\`R_Constituency\`, Trenddata.\`2019_YSRCP\`, Trenddata.\`2019_TDP\`, Trenddata.\`2019_JSP\`, Trenddata.\`2019_OTHERS\`
      `;
  
      const results = await db.sequelize.query(query);
      res.json(results[0]);
      console.log(results);
  
    } catch (error) {
      next(error);
    }
  };
  
  
  


module.exports={
    DISTRICT_PARLIMENT,
    TrendReport,

}