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
      LEFT JOIN fileddata ON resultdata.\`Constituency\` = fileddata.\`R_Constituency\`
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


const PrefferdCaste= async(req,res,next)=>{
  try {
    const { district, constituency, week } = req.body;

    const query = `
    SELECT 
    fileddata.Caste,
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`Party\` = 'YSRCP' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'YSRCP',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`Party\` = 'TDP' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'TDP',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`Party\` = 'JSP' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'JSP',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`Party\` = 'BJP' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'BJP',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`Party\` = 'INC' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'INC',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`Party\` = 'Not Decided' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'Not Decided',
    CONCAT(ROUND((SUM(CASE WHEN fileddata.\`Party\` NOT IN ('YSRCP', 'TDP', 'JSP','BJP','INC','Not Decided') THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2), '%') AS \`Others\`
    FROM 
    fileddata,
    (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Week = :week ) AS Castes
    WHERE 
    fileddata.Caste IS NOT NULL 
    AND \`Party\` IS NOT NULL 
    AND factor IS NOT NULL 
    AND District = :district
    AND R_Constituency = :constituency
    AND Week = :week
    AND fileddata.Caste = Castes.Caste
    GROUP BY fileddata.Caste
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
      matrix[result.Caste] = [result.YSRCP, result.TDP, result.JSP, result.Others,result.BJP, result.INC,result['Not Decided']];
    });

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        YSRCP: matrix[caste][0],
        TDP: matrix[caste][1],
        JSP:matrix[caste][2],
        BJP:matrix[caste][3],
        INC:matrix[caste][4],
        ['Not Decided']:matrix[caste][5],
        Others:matrix[caste][6]
      };
    });

    res.json(output);
    // console.log(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
} 

// Prefferd MLA CANDIDATE question based on MLA satishfaction  FOR those where party belongs to YSRCP
const PrefferMLAcandidate= async(req,res,next)=>{
  try {
    const { district, constituency, week } = req.body;

    const query = `
      SELECT 
      fileddata.\`MLA Preference\`,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Good_Percentage,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` AND \`MLA Satisfaction\` = 'Not Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Not_Good_Percentage
      FROM 
        fileddata,
        (SELECT DISTINCT \`MLA Preference\` FROM fileddata WHERE \`MLA Preference\` IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Week = :week ) AS \`MLA Preference\`
      WHERE 
        fileddata.\`MLA Preference\` IS NOT NULL 
        AND \`MLA Satisfaction\` IS NOT NULL 
        AND factor IS NOT NULL 
        AND District = :district
        AND R_Constituency = :constituency
        AND Week = :week
        AND Party = 'YSRCP'
        AND  fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\`
GROUP BY fileddata.\`MLA Preference\`
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
      matrix[result["MLA Preference"]] = [result.Good_Percentage, result.Not_Good_Percentage];
    });
    // console.log(matrix);

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        good_percentage: matrix[caste][0],
        not_good_percentage: matrix[caste][1]
      };
    });

    res.json(output);
    console.log(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
} 


const PrefferdMLAByCaste = async(req,res,next)=>{
  try {
    const { district, constituency, week } = req.body;

    const query = `
    SELECT 
    fileddata.Caste,
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`MLA Preference\` = 'Same MLA' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100, 2), 
      '%'
    ) AS 'SameMLA',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`MLA Preference\` = ' Other MLA' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100, 2), 
      '%'
    ) AS 'OtherMLA',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`MLA Preference\` = 'Anyone' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100, 2), 
      '%'
    ) AS 'Anyone'
    
    
    
    FROM 
    fileddata,
    (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Week = :week ) AS Castes
    WHERE 
    fileddata.Caste IS NOT NULL 
    AND \`MLA Preference\` IS NOT NULL 
    AND factor IS NOT NULL 
    AND District = :district
    AND R_Constituency = :constituency
    AND Week = :week
    AND fileddata.Caste = Castes.Caste
    GROUP BY fileddata.Caste
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
      let remainingPercentage = 100;
      matrix[result.Caste] = [
        result.SameMLA,
        result.OtherMLA,
        result.Anyone,
        // Add remaining percentage to the last column
        (remainingPercentage -= parseFloat(result.SameMLA) + parseFloat(result.OtherMLA) + parseFloat(result.Anyone)).toFixed(2) + '%'
      ];
    });

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        SameMLA: matrix[caste][0],
        OtherMLA: matrix[caste][1],
        Anyone:matrix[caste][2],
        Invaid: matrix[caste][3]
      };
    });

    res.json(output);
    console.log(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }



}

const PrefferdCMByCaste =async (req,res,next)=>{
  try {
    const { district, constituency, week } = req.body;

    const query = `
    SELECT 
    fileddata.Caste,
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`CM_Satisfaction\` = 'Not Good' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'NotGood',
    CONCAT(
      ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`CM_Satisfaction\` = 'Good' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
      '%'
    ) AS 'Good',
    CONCAT(ROUND((SUM(CASE WHEN fileddata.\`CM_Satisfaction\` NOT IN ('Not Good', 'Good') 
    THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100), 2), '%') AS \`Others\`
    FROM 
    fileddata,
    (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Week = :week ) AS Castes
    WHERE 
    fileddata.Caste IS NOT NULL 
    AND \`CM_Satisfaction\` IS NOT NULL 
    AND factor IS NOT NULL 
    AND District = :district
    AND R_Constituency = :constituency
    AND Week = :week
    AND fileddata.Caste = Castes.Caste
    GROUP BY fileddata.Caste
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
      matrix[result.Caste] = [result.Good, result.NotGood];
    });

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        Good: matrix[caste][0],
        NotGood: matrix[caste][1],
        // Others:matrix[caste][3]
      };
    });

    res.json(output);
    console.log(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  

}



// TDP+JSP Alliance  

// const TDP_JSP_Alliance = async (req, res, next) => {
//   try {
//     const { district, constituency, week } = req.body;
//     console.log(district);
//     console.log(constituency);
//     console.log(week);

//     const query = `
//       SELECT 
//         tc.\`TDP+JSP Alliance\`,
//         CONCAT(ROUND((SUM(CASE WHEN fd.Party = 'YSRCP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`YSRCP\`,
//         CONCAT(ROUND((SUM(CASE WHEN fd.Party = 'TDP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`TDP\`,
//         CONCAT(ROUND((SUM(CASE WHEN fd.Party = 'BJP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`BJP\`,
//         CONCAT(ROUND((SUM(CASE WHEN fd.Party = 'JSP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`JSP\`,
//         CONCAT(ROUND((SUM(CASE WHEN fd.Party = 'INC' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`INC\`,
//         CONCAT(ROUND((SUM(CASE WHEN fd.Party = 'Not Decided' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`Not Decided\`
//       FROM fileddata fd 
//       JOIN (
//         SELECT DISTINCT \`TDP+JSP Alliance\`
//         FROM fileddata
//         WHERE \`TDP+JSP Alliance\` IS NOT NULL
//         AND District = District
//         AND R_Constituency = R_Constituency
//         AND Week = Week
//         ORDER BY \`TDP+JSP Alliance\`
//       ) tc ON fd.\`TDP+JSP Alliance\` = tc.\`TDP+JSP Alliance\`
//       WHERE  fd.District = District
//       AND fd.R_Constituency = R_Constituency
//       AND fd.Week = Week
//       GROUP BY tc.\`TDP+JSP Alliance\`;
//     `;

//     const result = await db.sequelize.query(query, {
//       type: db.sequelize.QueryTypes.SELECT,
//       replacements: {
//         District: district,
//         R_Constituency: constituency,
//         Week: week
//       }
//     });

//     res.status(200).json(result[0]);
//     console.log(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// }

// only  for TDP + JSP Alliance data 
const TDP_JSP_Alliance = async (req, res, next) => {
  try {
    const { district, constituency, week } = req.body;

    const query = `
      SELECT 
        Party,
        CONCAT(ROUND((SUM(CASE WHEN fd.\`TDP+JSP Alliance\` = 'YSRCP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`YSRCP\`,
        CONCAT(ROUND((SUM(CASE WHEN fd.\`TDP+JSP Alliance\` = 'Will Not Vote' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`Will Not Vote\`,
        CONCAT(ROUND((SUM(CASE WHEN fd.\`TDP+JSP Alliance\` = 'TDP+JSP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`TDP+JSP\`
      FROM fileddata fd 
      WHERE fd.District = :District AND fd.R_Constituency = :R_Constituency AND fd.Week = :Week AND fd.\`TDP+JSP Alliance\` IS NOT NULL
        AND Party IN ('TDP', 'JSP')
      GROUP BY Party;
    `;

    const result = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        District: district,
        R_Constituency: constituency,
        Week: week
      }
    });
    const query2 = `
    SELECT 
        \`TDP Full\`,
        COUNT(*) 
 
        FROM fileddata 
        WHERE fileddata.District = :District AND fileddata.R_Constituency = :R_Constituency AND fileddata.Week = :Week AND \`TDP Full\` IS NOT NULL
       
    GROUP BY \`TDP Full\`;
`;

  const result2 = await db.sequelize.query(query2, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: {
      District: district,
      R_Constituency: constituency,
      Week: week
    }
  });

  const query3 = `
  SELECT 
  \`JSP Full\`,
  COUNT(*) 
 
  FROM fileddata 
  WHERE fileddata.District = :District AND fileddata.R_Constituency = :R_Constituency AND fileddata.Week = :Week AND \`JSP Full\` IS NOT NULL
 

GROUP BY \`JSP Full\`;

  `;

  const result3 = await db.sequelize.query(query3, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: {
      District: district,
      R_Constituency: constituency,
      Week: week
    }
  });

  res.status(200).json({ result, result2, result3 });
    // console.log(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

//PrefferYSRCPCoordinator 

const PrefferYSRCPCoordinator= async(req,res,next)=>{
  try {
    const { district, constituency, week } = req.body;

    const query = `
      SELECT 
      fileddata.\`YSRCP Co-ordinator\`,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.\`YSRCP Co-ordinator\` = \`YSRCP Co-ordinator\`.\`YSRCP Co-ordinator\` AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.\`YSRCP Co-ordinator\` = \`YSRCP Co-ordinator\`.\`YSRCP Co-ordinator\` THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Good_Percentage,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.\`YSRCP Co-ordinator\` = \`YSRCP Co-ordinator\`.\`YSRCP Co-ordinator\` AND \`MLA Satisfaction\` = 'Not Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.\`YSRCP Co-ordinator\` = \`YSRCP Co-ordinator\`.\`YSRCP Co-ordinator\` THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS Not_Good_Percentage
      FROM 
        fileddata,
        (SELECT DISTINCT \`YSRCP Co-ordinator\` FROM fileddata WHERE \`YSRCP Co-ordinator\` IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Week = :week ) AS \`YSRCP Co-ordinator\`
      WHERE 
        fileddata.\`YSRCP Co-ordinator\` IS NOT NULL 
        AND \`MLA Satisfaction\` IS NOT NULL 
        AND factor IS NOT NULL 
        AND District = :district
        AND R_Constituency = :constituency
        AND Week = :week
        AND  fileddata.\`YSRCP Co-ordinator\` = \`YSRCP Co-ordinator\`.\`YSRCP Co-ordinator\`
GROUP BY fileddata.\`YSRCP Co-ordinator\`
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
      matrix[result["YSRCP Co-ordinator"]] = [result.Good_Percentage, result.Not_Good_Percentage];
    });
    // console.log(matrix);

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        good_percentage: matrix[caste][0],
        not_good_percentage: matrix[caste][1]
      };
    });

    res.json(output);
    console.log(output);
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
    Castsatisfactionmla,
    PrefferdCaste,
    PrefferMLAcandidate,
    PrefferdMLAByCaste,
    PrefferdCMByCaste,
    TDP_JSP_Alliance,
    PrefferYSRCPCoordinator 
  
  };
  
