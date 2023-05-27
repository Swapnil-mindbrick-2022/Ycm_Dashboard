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

  const districtsPromise = db.fileddata.findAll({
    attributes: [
      [Sequelize.literal(`DISTINCT(${districtOrParliament})`), 'district']
    ],
    order: [
      [
        Sequelize.literal(`CASE ${districtOrParliament}
          WHEN 'SRIKAKULAM' THEN 1 
          WHEN 'VIZIANAGARAM' THEN 2 
          WHEN 'VISAKHAPATNAM' THEN 3
          WHEN 'EAST GODAVARI' THEN 4 
          WHEN 'WEST GODAVARI' THEN 5
          WHEN 'KRISHNA' THEN 6 
          WHEN 'GUNTUR' THEN 7
          WHEN 'PRAKASAM' THEN 8 
          WHEN 'NELLORE' THEN 9
          WHEN 'KADAPA' THEN 10 
          WHEN 'KURNOOL' THEN 11
          WHEN 'CHITTOOR' THEN 12
          ELSE 13 
        END`),
        'ASC'
      ]
    ],
    raw: true
  }).then(rows => rows.map(row => row.district));
  

  try {
    const districts = await districtsPromise; // Move the declaration of 'districts' here

    const resultPromise = db.fileddata.findAll({
      attributes: [
        'RCaste',
        ...districts.map(district => [
          Sequelize.literal(`COALESCE(CONCAT(ROUND(SUM(CASE WHEN ${districtOrParliament} = '${district}' AND Party = '${selectedParty}' THEN factor ELSE 0 END)/SUM(CASE WHEN ${districtOrParliament} = '${district}' THEN factor ELSE 0 END)*100, 0), '%'), 0)`),
          district
        ]),
      ],
      where: {
        Caste: {
          [Op.not]: null
        },
        SET_F: 'Consider' // add this condition
      },
      group: ['RCaste'],
      order: [
        // ['Caste', 'ASC']
        [Sequelize.literal('SUM(factor)'), 'DESC'],
        // [Sequelize.literal('MAX(Week)'), 'DESC'],
      ],
      raw: true
    });

    const result = await resultPromise;

    const output = result.map(item => {
      const newObj = { Caste: item.RCaste };
      districts.forEach(district => {
        newObj[district] = `${item[district]}`;
      });
      return newObj;
    });

    res.json(output);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



module.exports = {
  districtAndParliaments
};

