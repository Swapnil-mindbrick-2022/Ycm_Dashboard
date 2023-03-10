const sequelize  = require('sequelize')
const { QueryTypes } = require('sequelize');
// const nodeify = require('nodeify');
// const { Op } = require('sequelize');
const db = require("../../models");
const fileddata = db.fileddata

const resultdata= db.resultdata



const _ = require('lodash');
const reader = require('xlsx');
const excel = require("exceljs")
const fs = require("fs");



const DISTRICT = async(req,res,next)=>{
    try {
        const results = await db.sequelize.query(
          'SELECT DISTINCT District FROM fileddata'
        );
    
        const districts = results[0].map(result => result.District);
        res.json(districts);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
      }

}

const  CONSTITUENCY =async(req, res, next)=>{

    const selectedDistrict = req.query.district;

    try {
      const results = await db.sequelize.query(
        'SELECT DISTINCT R_Constituency FROM fileddata WHERE District = :district',
        {
          replacements: { district: selectedDistrict },
          type: sequelize.QueryTypes.SELECT
        }
      );
  
      const constituencies = results.map(result => result.R_Constituency);
      res.json(constituencies);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
}

const SURVEYDATE = async(req,res,next)=>{
    const selectedDistrict = req.query.district;
    const selectedConstituency = req.query.constituency;
  
    try {
      const results = await db.sequelize.query(
        'SELECT DISTINCT Week FROM fileddata WHERE District = :district AND R_Constituency = :constituency',
        {
          replacements: { district: selectedDistrict, constituency: selectedConstituency },
          type: sequelize.QueryTypes.SELECT
        }
      );
  
      const weeks = results.map(result => result.Week);
      res.json(weeks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }

}



const CM_Satisfaction = async (req, res) => {
  const { district, constituency, week } = req.body;

  try {
    const result = await db.sequelize.query(
      `SELECT 
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`CM_Satisfaction\` = 'Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`CM_Satisfaction\` = 'Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`CM_Satisfaction\` = 'Good' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`CM_Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${week ? `AND Week = '${week}'` : ''}
      
      UNION ALL
      
      SELECT
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`CM_Satisfaction\` = 'Not Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`CM_Satisfaction\` = 'Not Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`CM_Satisfaction\` = 'Not Good' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`CM_Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${week ? `AND Week = '${week}'` : ''}
    `, { type: sequelize.QueryTypes.SELECT });

    // res.json([result]); // wrap result in an array
    res.send(result)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}

const TopFiveCast= async(req,res,next)=>{
  try {
    const { district, constituency, week } = req.body;

    const query = `
      SELECT 
        fileddata.Caste,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND CM_Satisfaction = 'Good' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Good_Percentage,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND CM_Satisfaction = 'Not Good' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Not_Good_Percentage
      FROM 
        fileddata,
        (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Week = :week LIMIT 5) AS Castes
      WHERE 
        fileddata.Caste IS NOT NULL 
        AND CM_Satisfaction IS NOT NULL 
        AND factor IS NOT NULL 
        AND District = :district
        AND R_Constituency = :constituency
        AND Week = :week
        AND fileddata.Caste = Castes.Caste
      GROUP BY fileddata.Caste
      ORDER BY Good_Percentage DESC
    `;
    const results = await db.sequelize.query(query, { 
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        week
      }
    });

    // Transform the result into a matrix with castes as rows and good/not good percentages as columns
    const matrix = {};
    results.forEach((result) => {
      matrix[result.Caste] = [result.Good_Percentage, result.Not_Good_Percentage];
    });

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        good_percentage: matrix[caste][0],
        not_good_percentage: matrix[caste][1]
      };
    });

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
} 



const SummeryReport = async (req, res, next) => {
  try {
    const { district, constituency, week } = req.body;

    if (!district || !constituency || !week) {
      return res.status(400).json({ error: 'Missing district, constituency, or week field in request body' });
    }

    const query = `
      SELECT 
        resultdata.\`Mandal Name\`,
        CONCAT(resultdata.\`2019_YSRCP\`) AS \`2019 YSRCP\`,
        CONCAT(resultdata.\`2019_TDP\`) AS \`2019 TDP\`,
        CONCAT(resultdata.\`2019_JSP\`) AS \`2019 JSP\`,
        CONCAT(resultdata.\`2014_YSRCP\`) AS \`2014 YSRCP\`,
        CONCAT(resultdata.\`2014_TDP\`) AS \`2014 TDP\`,
        CONCAT(resultdata.\`2014_Others\`) AS \`2014 Others\`,
        CONCAT(ROUND((SUM(CASE WHEN fileddata.Party = 'YSRCP' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2), '%') AS \`YSRCP\`,
        CONCAT(ROUND((SUM(CASE WHEN fileddata.Party = 'TDP' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2), '%') AS \`TDP\`,
        CONCAT(ROUND((SUM(CASE WHEN fileddata.Party = 'JSP' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2), '%') AS \`JSP\`,
        CONCAT(ROUND((SUM(CASE WHEN fileddata.Party NOT IN ('YSRCP', 'TDP', 'JSP') THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2), '%') AS \`Others\`
      FROM resultdata
      JOIN fileddata ON resultdata.\`Mandal Name\` = fileddata.\`Mandal Name\`
      WHERE fileddata.CM_Satisfaction IN ('Good', 'Not Good')
        AND fileddata.District = :district
        AND fileddata.R_Constituency = :constituency
        AND fileddata.Week = :week
      GROUP BY resultdata.\`Mandal Name\`, resultdata.\`2019_YSRCP\`, resultdata.\`2019_TDP\`, resultdata.\`2019_JSP\`, resultdata.\`2014_YSRCP\`, resultdata.\`2014_TDP\`, resultdata.\`2014_Others\`
      ORDER BY resultdata.\`Mandal Name\`;
    `;

    const result = await db.sequelize.query(query, {
      replacements: { district, constituency, week },
      type: sequelize.QueryTypes.SELECT,
    });

    if (!result) {
      return res.status(500).json({ error: 'Failed to retrieve data from the database' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};



// const SummeryReport = async (req, res, next) => {
//   try {
//     const { district, constituency, week } = req.body;
  
//     const result = await resultdata.findAll({
//       attributes: [
//         sequelize.col('Mandal Name'),
//         [sequelize.fn('CONCAT', sequelize.col('2019_YSRCP')), '2019 YSRCP'],
//         [sequelize.fn('CONCAT', sequelize.col('2019_TDP')), '2019 TDP'],
//         [sequelize.fn('CONCAT', sequelize.col('2019_JSP')), '2019 JSP'],
//         [sequelize.fn('CONCAT', sequelize.col('2014_YSRCP')), '2014 YSRCP'],
//         [sequelize.fn('CONCAT', sequelize.col('2014_TDP')), '2014 TDP'],
//         [sequelize.fn('CONCAT', sequelize.col('2014_Others')), '2014 Others'],
//         [
//           sequelize.literal(
//             'ROUND((SUM(CASE WHEN fileddata.Party = \'YSRCP\' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2) || \'%\''
//           ),
//           'YSRCP'
//         ],
//         [
//           sequelize.literal(
//             'ROUND((SUM(CASE WHEN fileddata.Party = \'TDP\' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2) || \'%\''
//           ),
//           'TDP'
//         ],
//         [
//           sequelize.literal(
//             'ROUND((SUM(CASE WHEN fileddata.Party = \'JSP\' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2) || \'%\''
//           ),
//           'JSP'
//         ],
//         [
//           sequelize.literal(
//             'ROUND((SUM(CASE WHEN fileddata.Party NOT IN (\'YSRCP\', \'TDP\', \'JSP\') THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2) || \'%\''
//           ),
//           'Others'
//         ],
//       ],
//       include: {
//         model: fileddata,
//         where: {
//           CM_Satisfaction: {
//             [Op.in]: ['Good', 'Not Good'],
//           },
//           District: district,
//           R_Constituency: constituency,
//           Week: week,
//         },
//         raw: true,
//       },
//       group: [
//         'Mandal Name',
//         '2019_YSRCP',
//         '2019_TDP',
//         '2019_JSP',
//         '2014_YSRCP',
//         '2014_TDP',
//         '2014_Others',
//       ],
//       order: [['Mandal Name', 'ASC']],
//     });
  
//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
  
// };

const Mlasatishfaction = async (req, res) => {
  const { district, constituency, week } = req.body;

  try {
    const result = await db.sequelize.query(
      `SELECT 
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`MLA Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${week ? `AND Week = '${week}'` : ''}
      
      UNION ALL
      
      SELECT
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`MLA Satisfaction\` = 'Not Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`MLA Satisfaction\` = 'Not Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`MLA Satisfaction\` = 'Not Good.' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`MLA Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${week ? `AND Week = '${week}'` : ''}
    `, { type: sequelize.QueryTypes.SELECT });

    // res.json([result]); // wrap result in an array
    res.send(result)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}


const Castsatisfactionmla= async(req,res,next)=>{
  try {
    const { district, constituency, week } = req.body;

    const query = `
      SELECT 
        fileddata.Caste,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Good_Percentage,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`MLA Satisfaction\` = 'Not Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Not_Good_Percentage
      FROM 
        fileddata,
        (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Week = :week ) AS Castes
      WHERE 
        fileddata.Caste IS NOT NULL 
        AND \`MLA Satisfaction\` IS NOT NULL 
        AND factor IS NOT NULL 
        AND District = :district
        AND R_Constituency = :constituency
        AND Week = :week
        AND fileddata.Caste = Castes.Caste
      GROUP BY fileddata.Caste
      ORDER BY Good_Percentage DESC
    `;
    const results = await db.sequelize.query(query, { 
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        week
      }
    });

    // Transform the result into a matrix with castes as rows and good/not good percentages as columns
    const matrix = {};
    results.forEach((result) => {
      matrix[result.Caste] = [result.Good_Percentage, result.Not_Good_Percentage];
    });

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        good_percentage: matrix[caste][0],
        not_good_percentage: matrix[caste][1]
      };
    });

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
} 


 
module.exports = {
    DISTRICT,
    CONSTITUENCY,
    SURVEYDATE,
    CM_Satisfaction,
    TopFiveCast,
    SummeryReport,
    Mlasatishfaction,
    Castsatisfactionmla
  
  };
  
