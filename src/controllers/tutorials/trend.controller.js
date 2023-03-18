const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const nodeify = require('nodeify');
const CsvParser = require("json2csv").Parser;
const db = require("../../models");
const FiledData = db.fileddata;
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
        SELECT DISTINCT Constituency FROM resultdata
      `;
      const constituenciesResult = await db.sequelize.query(constituenciesQuery);
      const constituencies = constituenciesResult[0].map(constituency => constituency.Constituency);
  
      const partiesQuery = `
        SELECT DISTINCT Party FROM fileddata
      `;
      const partiesResult = await db.sequelize.query(partiesQuery);
      const parties = partiesResult[0].map(party => party.Party);
  
      const partyColumns = parties.map(party => {
        return `ROUND((SUM(CASE WHEN fileddata.Party = '${party}' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2) AS \`${party}\``;
      }).join(',');
  
      const query = `
        SELECT 
          resultdata.\`Constituency\`,
          resultdata.\`2019_YSRCP\` AS \`2019 YSRCP\`,
          resultdata.\`2019_TDP\` AS \`2019 TDP\`,
          resultdata.\`2019_JSP\` AS \`2019 JSP\`,
          resultdata.\`2014_YSRCP\` AS \`2014 YSRCP\`,
          resultdata.\`2014_TDP\` AS \`2014 TDP\`,
          resultdata.\`2014_Others\` AS \`2014 Others\`,
          ${partyColumns}
        FROM resultdata
        LEFT JOIN fileddata ON resultdata.\`Constituency\` = fileddata.\`R_Constituency\`
        WHERE ${whereClause}
        GROUP BY resultdata.\`Constituency\`, resultdata.\`2019_YSRCP\`, resultdata.\`2019_TDP\`, resultdata.\`2019_JSP\`, resultdata.\`2014_YSRCP\`, resultdata.\`2014_TDP\`, resultdata.\`2014_Others\`
      `;
  
      const results = await db.sequelize.query(query);
      res.json(results[0]);
      // console.log(results);
  
    } catch (error) {
      next(error);
    }
  };
  
  
  


module.exports={
    DISTRICT_PARLIMENT,
    TrendReport,

}