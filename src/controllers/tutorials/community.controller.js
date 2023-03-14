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



const districtAndParliaments = async (req, res, next) => {
  const { selectedOption, selectedParty } = req.query;

  if (!selectedOption || !selectedParty) {
    res.status(400).send('Please select both options');
    return;
  }

  let districtOrParliament = '';

  if (selectedOption.toUpperCase() === 'DISTRICT') {
    districtOrParliament = 'District';
  } else if (selectedOption.toUpperCase() === 'PARLIAMENT') {
    districtOrParliament = 'Parliament';
  } else {
    res.status(400).send('Invalid selectedOption');
    return;
  }

  const districts = await db.fileddata.findAll({
    attributes: [[Sequelize.literal(`DISTINCT(${districtOrParliament})`), 'district']],
    order: [[Sequelize.col('district'), 'ASC']],
    raw: true
  }).then(rows => rows.map(row => row.district));

  const attributes = [
    'Caste',
    ...districts.map(district => [
      Sequelize.literal(`CONCAT(ROUND(SUM(CASE WHEN ${districtOrParliament} = '${district}' THEN factor ELSE 0 END) / SUM(factor) * 100), '%')`),
      district
    ])
  ];

  const result = await db.fileddata.findAll({
    attributes,
    where: {
      Party: selectedParty,
      Caste: {
        [Op.not]: null
      }
    },
    group: ['Caste'],
    order: [
      ['Caste', 'ASC']
    ],
    raw: true
  });

  const output = result.map(item => {
    const newObj = { Caste: item.Caste };
    districts.forEach(district => {
      newObj[district] = item[district];
    });
    return newObj;
  });

  res.json(output);
};

module.exports = {
  districtAndParliaments
};

  