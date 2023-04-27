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
        'SELECT DISTINCT Date FROM fileddata WHERE District = :district AND R_Constituency = :constituency',
        {
          replacements: { district: selectedDistrict, constituency: selectedConstituency },
          type: sequelize.QueryTypes.SELECT
        }
      );
  
      const weeks = results.map(result => result.Date);
      res.json(weeks);
      console.log(weeks)
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }

}



const CM_Satisfaction = async (req, res) => {
  const { district, constituency, Date } = req.body;

  try {
    const result = await db.sequelize.query(
      `SELECT 
        'Good' AS type,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`CM_Satisfaction\` = 'Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`CM_Satisfaction\` = 'Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`CM_Satisfaction\` = 'Good' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`CM_Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${Date ? `AND Date = '${Date}'` : ''}
      
      UNION ALL
      
      SELECT
        'Not Good' AS type,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`CM_Satisfaction\` = 'Not Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`CM_Satisfaction\` = 'Not Good' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`CM_Satisfaction\` = 'Not Good' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`CM_Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${Date ? `AND Date = '${Date}'` : ''}
    `, { type: sequelize.QueryTypes.SELECT });

    const formattedResult = {
      "Good": {
        "MALE": result[0].MALE,
        "FEMALE": result[0].FEMALE,
        "TOTAL": result[0].TOTAL
      },
      "Not Good": {
        "MALE": result[1].MALE,
        "FEMALE": result[1].FEMALE,
        "TOTAL": result[1].TOTAL
      }
    };

    res.send(formattedResult);
    console.log(formattedResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}


const TopFiveCast= async(req,res,next)=>{
  try {
    const { district, constituency, Date } = req.body;

    const query = `
      SELECT 
        fileddata.Caste,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND CM_Satisfaction = 'Good' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS SATISFIED,
        CONCAT(
          ROUND(SUM(CASE WHEN fileddata.Caste = Castes.Caste AND CM_Satisfaction = 'Not Good' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END) * 100), 
          '%'
        ) AS \`NOT SATISFIED\`
      FROM 
        fileddata,
        (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Date = :Date LIMIT 5) AS Castes
      WHERE 
        fileddata.Caste IS NOT NULL 
        AND CM_Satisfaction IS NOT NULL 
        AND factor IS NOT NULL 
        AND District = :district
        AND R_Constituency = :constituency
        AND Date = :Date
        AND fileddata.Caste = Castes.Caste
      GROUP BY fileddata.Caste
      ORDER BY SUM(Factor) ASC;
    `;
    const results = await db.sequelize.query(query, { 
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        Date
      }
    });

    // Transform the result into a matrix with castes as rows and good/not good percentages as columns
    const matrix = {};
    results.forEach((result) => {
      matrix[result.Caste] = [result.SATISFIED, result['NOT SATISFIED']];
    });

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        SATISFIED: matrix[caste][0],
        ['NOT SATISFIED']: matrix[caste][1]
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
    const { district, constituency, Date } = req.body;

    if (!district || !constituency || !Date) {
      return res.status(400).json({ error: 'Missing district, constituency, or Date field in request body' });
    }

    const query = `
    WITH \`mandal_avgs\` AS (
      SELECT
          fileddata.Rev_Mandal AS MANDAL,
          CONCAT(FORMAT(AVG(resultdata.\`2019_YSRCP\`), 0), '%') AS '2019 YSRCP',
          CONCAT(FORMAT(AVG(resultdata.\`2019_TDP\`), 0), '%') AS '2019 TDP',
          CONCAT(FORMAT(AVG(resultdata.\`2019_JSP\`), 0), '%') AS '2019 JSP',
          CONCAT(FORMAT(AVG(resultdata.\`2014_YSRCP\`), 0), '%') AS '2014 YSRCP',
          CONCAT(FORMAT(AVG(resultdata.\`2014_TDP\`), 0), '%') AS '2014 TDP',
          CONCAT(FORMAT(AVG(resultdata.\`2014_Others\`), 0), '%') AS '2014 Others',
          CONCAT(FORMAT(SUM(CASE WHEN fileddata.Party = 'YSRCP' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100, 0), '%') AS YSRCP,
          CONCAT(FORMAT(SUM(CASE WHEN fileddata.Party = 'TDP' THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor) * 100, 0), '%') AS TDP,
          CONCAT(ROUND((((SUM(CASE WHEN fileddata.Party = 'JSP' THEN fileddata.Factor ELSE 0 END) + SUM(CASE WHEN fileddata.Party = 'BJP' THEN fileddata.Factor ELSE 0 END)) / SUM(fileddata.Factor)) * 100)), '%') AS JSP_BJP,
          CONCAT(ROUND(((SUM(CASE WHEN fileddata.Party NOT IN ('TDP', 'YSRCP', 'JSP', 'BJP') THEN fileddata.Factor ELSE 0 END) / SUM(fileddata.Factor)) * 100)), '%') AS OTHER
  
      FROM resultdata
      LEFT JOIN fileddata ON resultdata.\`Mandal Name\` = fileddata.\`Rev_Mandal\`
      WHERE fileddata.CM_Satisfaction IN ('Good', 'Not Good')
          AND fileddata.District = :district
          AND fileddata.R_Constituency = :constituency
          AND fileddata.Date = :Date
          AND fileddata.Rev_Mandal IS NOT NULL -- Exclude the 'Total' row
      GROUP BY fileddata.Rev_Mandal
  )
  SELECT 'Total' AS MANDAL,
   CONCAT(FORMAT(AVG(\`2019 YSRCP\`), 0), '%') AS \`2019 YSRCP\`,
   CONCAT(FORMAT(AVG(\`2019 TDP\`), 0), '%') AS \`2019 TDP\`,
   CONCAT(FORMAT(AVG(\`2019 JSP\`), 0), '%') AS \`2019 JSP\`,
   CONCAT(FORMAT(AVG(\`2014 YSRCP\`), 0), '%') AS \`2014 YSRCP\`,
   CONCAT(FORMAT(AVG(\`2014 TDP\`), 0), '%') AS \`2014 TDP\`,
   CONCAT(FORMAT(AVG(\`2014 Others\`), 0), '%') AS \`2014 Others\`,
   CONCAT(FORMAT(AVG(YSRCP), 0), '%') AS YSRCP,
   CONCAT(FORMAT(AVG(TDP), 0), '%') AS TDP,
   CONCAT(FORMAT(AVG(JSP_BJP), 0), '%') AS JSP_BJP,
   CONCAT(FORMAT(AVG(OTHER), 0), '%') AS OTHER
  FROM \`mandal_avgs\`
  UNION ALL
  SELECT \`MANDAL\`,
      \`2019 YSRCP\`,
      \`2019 TDP\`,
      \`2019 JSP\`,
      \`2014 YSRCP\`,
      \`2014 TDP\`,
      \`2014 Others\`,
      YSRCP,
      TDP,
      JSP_BJP,
      OTHER
  FROM \`mandal_avgs\`
  ORDER BY \`MANDAL\`;

    `;

    const result = await db.sequelize.query(query, {
      replacements: { district, constituency, Date },
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
  const { district, constituency, Date } = req.body;

  try {
    const result = await db.sequelize.query(
      `SELECT 
        'Good.' AS type,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`MLA Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${Date ? `AND Date = '${Date}'` : ''}
      
      UNION ALL
      
      SELECT
        'Not Good.' AS type,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'MALE' AND \`MLA Satisfaction\` = 'Not good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'MALE' THEN factor ELSE 0 END) * 100), '%') AS MALE,
        CONCAT(ROUND(SUM(CASE WHEN Gender = 'FEMALE' AND \`MLA Satisfaction\` = 'Not good.' THEN factor ELSE 0 END) / SUM(CASE WHEN Gender = 'FEMALE' THEN factor ELSE 0 END) * 100), '%') AS FEMALE,
        CONCAT(ROUND(SUM(CASE WHEN \`MLA Satisfaction\` = 'Not good.' THEN factor ELSE 0 END) / SUM(factor) * 100), '%') AS TOTAL
      FROM 
        fileddata
      WHERE 
        Gender IS NOT NULL AND \`MLA Satisfaction\` IS NOT NULL AND factor IS NOT NULL
        ${district ? `AND District = '${district}'` : ''}
        ${constituency ? `AND R_Constituency = '${constituency}'` : ''}
        ${Date ? `AND Date = '${Date}'` : ''}
    `, { type: sequelize.QueryTypes.SELECT });

    const formattedResult = {
      "Good.": {
        "MALE": result[0].MALE,
        "FEMALE": result[0].FEMALE,
        "TOTAL": result[0].TOTAL
      },
      "Not Good.": {
        "MALE": result[1].MALE,
        "FEMALE": result[1].FEMALE,
        "TOTAL": result[1].TOTAL
      }
    };

    res.send(formattedResult);
    console.log(formattedResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
}


const Castsatisfactionmla= async(req,res,next)=>{
  try {
    const { district, constituency, Date } = req.body;

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
        (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Date = :Date ) AS Castes
      WHERE 
        fileddata.Caste IS NOT NULL 
        AND \`MLA Satisfaction\` IS NOT NULL 
        AND factor IS NOT NULL 
        AND District = :district
        AND R_Constituency = :constituency
        AND Date = :Date
        AND fileddata.Caste = Castes.Caste
      GROUP BY fileddata.Caste
      ORDER BY SUM(Factor) DESC;
    `;
    const results = await db.sequelize.query(query, { 
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        Date
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
    const { district, constituency, Date } = req.body;

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
      ROUND(((SUM(CASE WHEN fileddata.Caste = Castes.Caste AND Party = 'JSP' THEN factor ELSE 0 END) + SUM(CASE WHEN fileddata.Caste = Castes.Caste AND Party = 'BJP' THEN factor ELSE 0 END)) / SUM(CASE WHEN fileddata.Caste = Castes.Caste THEN factor ELSE 0 END)) * 100),
      '%'
    ) AS 'JSP_BJP',
    
   
    CONCAT(ROUND((100 - (SUM(CASE WHEN fileddata.Caste = Castes.Caste AND \`Party\` IN ('YSRCP', 'TDP', 'JSP', 'BJP') THEN factor ELSE 0 END) / SUM(fileddata.Factor) * 100)), 0), '%') AS \`Others\`
    FROM 
    fileddata,
    (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Date = :Date ) AS Castes
    WHERE 
    fileddata.Caste IS NOT NULL 
    AND \`Party\` IS NOT NULL 
    AND factor IS NOT NULL 
    AND District = :district
    AND R_Constituency = :constituency
    AND Date = :Date
    AND fileddata.Caste = Castes.Caste
    GROUP BY fileddata.Caste
    ORDER BY SUM(Factor) ASC;
    `;

    const results = await db.sequelize.query(query, { 
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        Date
      }
    });

    // Transform the result into a matrix with castes as rows and good/not good percentages as columns
    const matrix = {};
    results.forEach((result) => {
      matrix[result.Caste] = [result.YSRCP, result.TDP, result.JSP_BJP, result.Others];
    });

    // Build the JSON object
    const output = {};
    Object.keys(matrix).forEach((caste) => {
      output[caste] = {
        YSRCP: matrix[caste][0],
        TDP: matrix[caste][1],
        JSP_BJP:matrix[caste][2],
        // BJP:matrix[caste][3],
       
        Others:matrix[caste][3]
      };
    });

    const query2 = `
    SELECT 
      \`Party\`,
      SUM(Factor) as totalFactor
    FROM fileddata 
    WHERE fileddata.District = :District 
    AND fileddata.R_Constituency = :R_Constituency 
    AND fileddata.Date = :Date 
    AND \`Party\` IS NOT NULL
    GROUP BY \`Party\`
    ORDER BY SUM(Factor) ASC;;
  `;
  
  
    const result1 = await db.sequelize.query(query2, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        District: district,
        R_Constituency: constituency,
        Date: Date
      }
    });



    res.status(200).json({ output, result1 });
    // console.log(output);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
} 

// Prefferd MLA CANDIDATE question based on MLA satishfaction  FOR those where party belongs to YSRCP
// const PrefferMLAcandidate= async(req,res,next)=>{
//   try {
//     const { district, constituency, Date } = req.body;

//     const query = `
//       SELECT 
//       fileddata.\`MLA Preference\`,
//         CONCAT(
//           ROUND(SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` AND \`MLA Satisfaction\` = 'Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` THEN factor ELSE 0 END) * 100), 
//           '%'
//         ) AS Good_Percentage,
//         CONCAT(
//           ROUND(SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` AND \`MLA Satisfaction\` = 'Not Good.' THEN factor ELSE 0 END) / SUM(CASE WHEN fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\` THEN factor ELSE 0 END) * 100), 
//           '%'
//         ) AS Not_Good_Percentage
//       FROM 
//         fileddata,
//         (SELECT DISTINCT \`MLA Preference\` FROM fileddata WHERE \`MLA Preference\` IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Date = :Date ) AS \`MLA Preference\`
//       WHERE 
//         fileddata.\`MLA Preference\` IS NOT NULL 
//         AND \`MLA Satisfaction\` IS NOT NULL 
//         AND factor IS NOT NULL 
//         AND District = :district
//         AND R_Constituency = :constituency
//         AND Date = :Date
//         AND Party = 'YSRCP'
//         AND  fileddata.\`MLA Preference\` = \`MLA Preference\`.\`MLA Preference\`
// GROUP BY fileddata.\`MLA Preference\`
//       ORDER BY Good_Percentage DESC
//     `;


    
//     const results = await db.sequelize.query(query, { 
//       type: db.sequelize.QueryTypes.SELECT,
//       replacements: {
//         district,
//         constituency,
//         Date
//       }
//     });

//     // Transform the result into a matrix with castes as rows and good/not good percentages as columns
//     const matrix = {};
//     results.forEach((result) => {
//       matrix[result["MLA Preference"]] = [result.Good_Percentage, result.Not_Good_Percentage];
//     });
//     // console.log(matrix);

//     // Build the JSON object
//     const output = {};
//     Object.keys(matrix).forEach((caste) => {
//       output[caste] = {
//         good_percentage: matrix[caste][0],
//         not_good_percentage: matrix[caste][1]
//       };
//     });

//     res.json(output);
//     console.log(output);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// } 




const PrefferMLAcandidate = async (req, res, next) => {
  try {
    const { district, constituency, Date } = req.body;

    const query = `
      SELECT 
        f.\`MLA Preference\`,
        CONCAT(
          ROUND(SUM(f.Factor) / (SELECT SUM(f2.Factor) FROM fileddata f2 JOIN cordinates c2 ON f2.R_Constituency = c2.\`R.Constituency\` AND f2.District = c2.District AND f2.Party = 'YSRCP' WHERE c2.District = :district AND c2.\`R.Constituency\` = :constituency AND f2.\`MLA Preference\` IN ('Same MLA', 'Anyone', ' Other MLA') AND f2.\`Date\` = :Date) * 100, 2), '%') AS totalFactor_percentage
      FROM fileddata f
      JOIN cordinates c ON f.R_Constituency = c.\`R.Constituency\` AND f.District = c.District
      WHERE c.District = :district AND c.\`R.Constituency\` = :constituency AND f.\`MLA Preference\` IN ('Same MLA', 'Anyone', ' Other MLA') AND f.Party = 'YSRCP' AND f.\`Date\` = :Date
      GROUP BY f.\`MLA Preference\`;
    `;
    const result = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        Date
      },
    });

    res.send(result);
    console.log(result)

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



const PrefferdMLAByCaste = async(req,res,next)=>{
  try {
    const { district, constituency, Date } = req.body;

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
    (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Date = :Date ) AS Castes
    WHERE 
    fileddata.Caste IS NOT NULL 
    AND \`MLA Preference\` IS NOT NULL 
    AND factor IS NOT NULL 
    AND District = :district
    AND R_Constituency = :constituency
    AND Date = :Date
    AND fileddata.Caste = Castes.Caste
    GROUP BY fileddata.Caste
    `;
    const results = await db.sequelize.query(query, { 
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        Date
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
    const { district, constituency, Date } = req.body;

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
    (SELECT DISTINCT Caste FROM fileddata WHERE Caste IS NOT NULL AND District = :district AND R_Constituency = :constituency AND Date = :Date ) AS Castes
    WHERE 
    fileddata.Caste IS NOT NULL 
    AND \`CM_Satisfaction\` IS NOT NULL 
    AND factor IS NOT NULL 
    AND District = :district
    AND R_Constituency = :constituency
    AND Date = :Date
    AND fileddata.Caste = Castes.Caste
    GROUP BY fileddata.Caste
    `;
    const results = await db.sequelize.query(query, { 
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        Date
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
// only  for TDP + JSP Alliance data 
const TDP_JSP_Alliance = async (req, res, next) => {
  try {
    const { district, constituency, Date } = req.body;

    const query = `
      SELECT 
        Party,
        CONCAT(ROUND((SUM(CASE WHEN fd.\`TDP+JSP Alliance\` = 'YSRCP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`YSRCP\`,
        CONCAT(ROUND((SUM(CASE WHEN fd.\`TDP+JSP Alliance\` = 'Will Not Vote' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`Will Not Vote\`,
        CONCAT(ROUND((SUM(CASE WHEN fd.\`TDP+JSP Alliance\` = 'TDP+JSP' THEN fd.Factor ELSE 0 END) / SUM(fd.Factor) * 100), 2), '%') AS \`TDP+JSP\`
      FROM fileddata fd 
      WHERE fd.District = :District AND fd.R_Constituency = :R_Constituency AND fd.Date = :Date AND fd.\`TDP+JSP Alliance\` IS NOT NULL
        AND Party IN ('TDP', 'JSP')
      GROUP BY Party;
    `;

    const result = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        District: district,
        R_Constituency: constituency,
        Date: Date
      }
    });
    const query2 = `
    SELECT 
        \`TDP Full\`,
        COUNT(*) 
 
        FROM fileddata 
        WHERE fileddata.District = :District AND fileddata.R_Constituency = :R_Constituency AND fileddata.Date = :Date AND \`TDP Full\` IS NOT NULL
       
    GROUP BY \`TDP Full\`;
`;

  const result2 = await db.sequelize.query(query2, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: {
      District: district,
      R_Constituency: constituency,
      Date: Date
    }
  });

  const query3 = `
  SELECT 
  \`JSP Full\`,
  COUNT(*) 
 
  FROM fileddata 
  WHERE fileddata.District = :District AND fileddata.R_Constituency = :R_Constituency AND fileddata.Date = :Date AND \`JSP Full\` IS NOT NULL
 

GROUP BY \`JSP Full\`;

  `;

  const result3 = await db.sequelize.query(query3, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: {
      District: district,
      R_Constituency: constituency,
      Date: Date
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

const PrefferYSRCPCoordinator = async (req, res, next) => {
  try {
    const { district, constituency, Date } = req.body;

    const query = `
      SELECT 
        f.\`YSRCP Co-ordinator\`,
        CONCAT(
          ROUND(SUM(f.Factor) / (SELECT SUM(f2.Factor) FROM fileddata f2 JOIN cordinates c2 ON f2.R_Constituency = c2.\`R.Constituency\` AND f2.District = c2.District AND f2.Party = 'YSRCP' WHERE c2.District = :district AND c2.\`R.Constituency\` = :constituency AND f2.\`YSRCP Co-ordinator\` IN ('Same Co-ordinator', 'Anyone', 'Other Co-ordinator') AND f2.\`Date\` = :Date) * 100, 2), '%') AS totalFactor_percentage
      FROM fileddata f
      JOIN cordinates c ON f.R_Constituency = c.\`R.Constituency\` AND f.District = c.District
      WHERE c.District = :district AND c.\`R.Constituency\` = :constituency AND f.\`YSRCP Co-ordinator\` IN ('Same Co-ordinator', 'Anyone', 'Other Co-ordinator') AND f.Party = 'YSRCP' AND f.\`Date\` = :Date
      GROUP BY f.\`YSRCP Co-ordinator\`;
    `;
    const results = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: {
        district,
        constituency,
        Date
      },
    });

    res.json(results);
    console.log(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


 
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
  
