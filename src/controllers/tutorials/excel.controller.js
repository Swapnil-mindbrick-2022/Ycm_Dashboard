const sequelize  = require('sequelize')
const nodeify = require('nodeify');
const CsvParser = require("json2csv").Parser;
const db = require("../../models");
const resultdata = db.resultdata
const fileddata = db.fileddata
const moment = require('moment');


const rawfileddata = db.rawfielddata

const _ = require('lodash');

const Uploadhistory = db.uploadhistory;


// const XLSX = require("read-excel-file/node");
// const ivrs = require("../../models/ivrs.model");
// const excel = require('fast-xlsx-reader');
const reader = require('xlsx');

const excel = require("exceljs")
// const { response } = require("express");
const fs = require("fs");
const { raw } = require('body-parser');

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * 
 */

const uploadmuliplefiles = async (req, res, next) => {
  const message = [];
  const batchSize = 70000;
  const filePath = __basedir + "/resources/static/assets/uploads/";
  const position = req.body.position
  if (position == "fileddata") {
    for (let file of req.files) {
      try {
        const path = filePath + file.filename;
        const rows = reader.read(path, { type: 'file' });
        const sheetNames = rows.SheetNames;
    
        for (let sheetName of sheetNames) {
          const arr = reader.utils.sheet_to_json(rows.Sheets[sheetName]);
          const batches = chunkArray(arr, batchSize);
    
          for (let batch of batches) {
            const bulkData = batch.map((res) => {

              let dateValue = res['Date'];
              if (typeof dateValue === 'number') {
                dateValue = new Date((dateValue - 25569) * 86400 * 1000);
              }
              if (dateValue instanceof Date && !isNaN(dateValue)) {
                const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
                formattedDate = dateValue.toLocaleDateString('en-US', options);
              }
              let dateValue2 = res.sdate;
              if (typeof dateValue2 === 'number') {
                dateValue2 = new Date((dateValue2 - 25569) * 86400 * 1000);
              }
              if (dateValue2 instanceof Date && !isNaN(dateValue2)) {
                const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
                formattedDate2 = dateValue2.toLocaleDateString('en-US', options);
              }
              return {
              District: res["District"] || res['DISTRICT'] ||null,
              PARLIAMENT: res.PARLIAMENT  ||res['PARLIAMENT'] || null,
              ['New District']: res['New District'] || null,
              R_Constituency: res.R_Constituency || null,
              // Date: moment.utc(res['Date'], 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD') || moment.utc('1970-01-01', 'YYYY-MM-DD'),
              Date: formattedDate || null,
          
              ["Timestamp"]: res["Timestamp"] ||res['TIMESTAMP']|| null,
              ["Location"]: res["Location"] || null,
              ['Audio Url']: res['Audio Url']  || null,
              ['Audio Duration (in secs)']: res['Audio Duration (in secs)'] || null,
              ['Offline Mode']: res['Offline Mode'] || null,
              ['Surveyor_Name']:res['Surveyor Name'] || null,
              ['Surveyor Phone Number']:res['Surveyor Phone Number'] || null,
              ['Name']:res['Name'] || null,
              ["Gender"]:res["Gender"] ||res['GENDER']||null,
              ['Contact Number']:res['Contact Number'] ||res['CONTACT NUMBER']|| null,
              ['Age Group']:res['Age Group'] ||res['AGE GROUP']|| null,
              ['Occupation']:res['Occupation'] ||res['OCCUPATION']||null,
              ['Caste Category']:res['Caste Category'] || null,
              ["RCaste"]:res["R.Caste"] || null,
              ["Caste"]:res["Caste"] || null,
              ['Constituency']:res['Constituency'] ||res['CONSTITUENCY']|| null,
              ['Mandal Name']:res['Mandal Name'] ||res['MANDAL NAME']|| null,
              ['Ward Number']:res['Ward Number'] ||res['GP NAME']|| null,
              ['Have you received any schemes from Government?']:res['Have you received any schemes from Government?'] || null,
              ['CM_Satisfaction']:res['CM_Satisfaction'] ||res[' CM SATISFACTION']|| null,
              ['Party']:res['Party'] || null,
              ["MLA Satisfaction"]:res["MLA Satisfaction"] || null,
              ['MLA Preference']:res['MLA Preference'] || null,
              ['Factor']:res['Factor'] || null,
              ['Set']:res['Set'] || null,
              ["SET_F"]:res["SET_F"] || null,
              ['Consider']:res['Consider'] || null,
              ['Known Candidate']:res['Known Candidate'] || null,
              ['Better Candidate']:res['Better Candidate'] || null,
              ['Known Candidate(TDP)']:res['Known Candidate(TDP)'] || null,
              ['YSRCP Co-ordinator']:res['YSRCP Co-ordinator'] || null,
              ['Tirupathi Bye elections']:res['Tirupathi Bye elections'] || null,
              ["If Not Why.?"]:res["If Not Why.?"] || null,
              ['YSRCP-Best Candidate']:res['YSRCP-Best Candidate'] || null,
              ['TDP+JSP Alliance']:res['TDP+JSP Alliance'] || null,
              ['TDP Full']:res['TDP Full'] || null,
              ['JSP Full']:res['JSP Full'] || null,
              ['TDP Candidate(Alliance)']:res['TDP Candidate(Alliance)'] || null,
              ['JSP Candidate(Alliance)']:res['JSP Candidate(Alliance)'] || null,
              ['TDP Candidate']:res['TDP Candidate'] || null,
              ['JSP Candidate']:res['JSP Candidate'] || null,
              ["TDP Candidate(Alliance)"]:res["TDP Candidate(Alliance)"] || null,
              ['JSP Candidate(Alliance)']:res['JSP Candidate(Alliance)'] || null,
              ['Week']:res['Week'] || null,
              ['Schemes Termination']:res['Schemes Termination'] || null,
              Rev_Mandal:res.Rev_Mandal ||res["R Mandal"] || null,
              sdate:formattedDate2|| null,
              ['C&S']:res['C&S'] || null,
              ["TDP+JSP Alliance O"]:res["TDP+JSP Alliance O"] || null
              };
            });
    
            await fileddata.bulkCreate(bulkData , {
              raw: true,
              benchmark: true,
              returning: false,
            });
          }
        }
    
        await deleteFile(path);
      } catch (error) {
        console.error(error);
        message.push(`Error processing file ${file.filename}`);
      }
    }
  } else if (position == "resultdata") {
    for (let file of req.files) {
      try {
        const path = filePath + file.filename;
        const rows = reader.read(path, { type: 'file' });
        const sheetNames = rows.SheetNames;
    
        for (let sheetName of sheetNames) {
          const arr = reader.utils.sheet_to_json(rows.Sheets[sheetName]);
          const batches = chunkArray(arr, batchSize);
    
          for (let batch of batches) {
            const bulkData = batch.map((res) => {
              return {
                District: res["District"] || res['DISTRICT'] || null,
                Constituency: res.Constituency || res['Constituency'] || null,
                ['Mandal Name']:res['Mandal Name'] || null,
                YEAR:res.YEAR || null,
                ['2019_YSRCP']:res['2019_YSRCP'] || null,
                ['2019_TDP']:res['2019_TDP'] || null,
                ['2019_JSP']:res['2019_JSP'] || null,
                ['2014_YSRCP']:res['2014_YSRCP'] || null,
                ['2014_TDP']:res['2014_TDP'] ||null,
                ['2014_Others']:res['2014_Others'] || null,
              };
            });
    
            await resultdata.bulkCreate(bulkData, {
              raw: true,
              benchmark: true,
              returning: false,
            });
          }
        }
    
        await deleteFile(path);
      } catch (error) {
        console.error(error);
        message.push(`Error processing file ${file.filename}`);
      }
    }
  }


  //  raw  data  upload  

  else if(position == "rawfileddata") {
    for (let file of req.files) {
      try {
        const path = filePath + file.filename;
        const rows = reader.read(path, { type: 'file' });
        const sheetNames = rows.SheetNames;
    
        for (let sheetName of sheetNames) {
          const arr = reader.utils.sheet_to_json(rows.Sheets[sheetName]);
          const batches = chunkArray(arr, batchSize);
    
          for (let batch of batches) {
            const bulkData = batch.map((res) => {
              
              let dateValue = res['Date'];
              if (typeof dateValue === 'number') {
                dateValue = new Date((dateValue - 25569) * 86400 * 1000);
              }
              if (dateValue instanceof Date && !isNaN(dateValue)) {
                const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
                formattedDate = dateValue.toLocaleDateString('en-US', options);
              }
           
              return {
              District: res["District"] || res['DISTRICT'] ||null,
              PARLIAMENT: res.PARLIAMENT  ||res['PARLIAMENT'] || null,
              ['New District']: res['New District'] || null,
              R_Constituency: res.R_Constituency ||res['R.Constituency'] ||null,
              // Date: moment.utc(res['Date'], 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD') || moment.utc('1970-01-01', 'YYYY-MM-DD'),
              ['Week']:res['Week'] || null,
              Date: formattedDate || null,
              
                
              ["Timestamp"]: res["Timestamp"] ||res['TIMESTAMP']|| null,
              ["Location"]: res["Location"] || null,
              ['Audio Url']: res['Audio Url']  || null,
              ['Audio Duration (in secs)']: res['Audio Duration (in secs)'] || null,
              ['Offline Mode']: res['Offline Mode'] || null,
              ['Surveyor_Name']:res['Surveyor Name'] || null,
              ['Surveyor Phone Number']:res['Surveyor Phone Number'] || null,
              ['Name']:res['Name'] || null,
              ["Gender"]:res["Gender"] ||res['GENDER']||null,
              ['Contact Number']:res['Contact Number'] ||res['CONTACT NUMBER']|| null,
              ['Age Group']:res['Age Group'] ||res['AGE GROUP']|| null,
              ['Occupation']:res['Occupation'] ||res['OCCUPATION']||null,
              ['Monthly Income']:res['Monthly Income'] ||res['నెలసరి ఆదాయం ']|| null,
              ['Caste Category']:res['Caste Category'] || null,
              ["RCaste"]:res["R.Caste"] || null,
              ["Caste"]:res["Caste"] || null,
              ['Constituency']:res['Constituency'] ||res['CONSTITUENCY']|| null,
              ['Mandal Name']:res['Mandal Name'] ||res['MANDAL']|| null,
              ['Ward Number']:res['Ward Number'] ||res['WARD NUMBER']|| null,
              ['CM_Satisfaction']:res['CM_Satisfaction'] ||res[' CM SATISFACTION']|| null,
              ['Party']:res['Party'] || null,
              ['TDP+JSP Alliance']:res['TDP+JSP Alliance'] || null,
              ['TDP Candidate(Alliance)']:res['TDP Candidate(Alliance)'] || null,
              ['JSP Candidate(Alliance)']:res['JSP Candidate(Alliance)'] || null,
              ["MLA Satisfaction"]:res["MLA Satisfaction"] || null,
              ['MLA Preference']:res['MLA Preference'] || null,
              ['2024_Candidate']:res  ['2024_Candidate'] || null, 
              ['Schemes Termination']:res['Schemes Termination'] || null,
              
              ['Factor']:res['Factor'] || null,
              ['Set']:res['Set'] || null,
              ["SET_F"]:res["Set_F"] || null,
              ['YSRCP Co-ordinator']:res['YSRCP Co-ordinator'] || null,
              ['TDP Full']:res['TDP FULL'] || null,
              ['JSP Full']:res['JSP FULL'] || null,
              


              };
            });
    
            await rawfileddata.bulkCreate(bulkData , {
              raw: true,
              benchmark: true,
              returning: false,
            });
          }
        }
    
        await deleteFile(path);
      } catch (error) {
        console.error(error);
        message.push(`Error processing file ${file.filename}`);
      }
    }
  }


  if (message.length > 0) {
    res.status(500).send(message.join('\n'));
  } else {
    res.status(200).send('All files have been processed successfully');
  }
};

const chunkArray = (arr, chunkSize) => {
  const chunks = [];
  let i = 0;
  
  while (i < arr.length) {
    chunks.push(arr.slice(i, i + chunkSize));
    i += chunkSize;
  }
  
  return chunks;
};

const deleteFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`File ${path} has been deleted`);
        resolve();
      }
    });
  });
};
;




module.exports = {
  uploadmuliplefiles,

};

