
import *  as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get command line arguments
const args = process.argv.slice(2);

const yearsExist= async (y1Folder:string, y2Folder:string) => {
  try {
    // Check if both year folders exist
    fs.access(y1Folder, fs.constants.R_OK, (err) => {
      console.log(`${y1Folder} ${err ? 'is not readable' : 'is readable'}`);
    });

    fs.access(y2Folder, fs.constants.R_OK, (err) => {
      console.log(`${y2Folder} ${err ? 'is not readable' : 'is readable'}`);
    });
  } catch (error) {
    console.error(`Error: One or both year folders don't exist`);
    return;
  }
}


const compareCollegeFolders = (year1Folder: string, year2Folder: string) : string[]  => {
  let y1Colleges = listFolders(year1Folder);
  let y2Colleges = listFolders(year2Folder);
  //console.log( y1Colleges);
  //console.log(y2Colleges);
  y1Colleges.forEach(college => {
    if(!y2Colleges.includes(college)){
      console.log(year2Folder, "doesnt have", college);
    }
  })
  return y1Colleges.filter(college => !y2Colleges.includes(college));
}

function listFolders(dirPath: string): string[] {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  return items
      .filter(item => item.isDirectory())
      .map(item => item.name);
}

const collegeFolders = async(yFolder: string, colleges: string[]) => {
    const collegeFolders = listFolders(yFolder);
    console.log(collegeFolders);
}

// function to compare the folder contents of 1 year vs another
const diff = async (year1: number, year2: number) => {
  const basePath = path.join(process.cwd(), "parsed_files", "major");

  const year1Folder = path.join(basePath, year1.toString());
  const year2Folder = path.join(basePath, year2.toString());

  console.log(`Comparing ${year1} vs ${year2}...`);
  console.log(`Year ${year1} folder: ${year1Folder}`);
  console.log(`Year ${year2} folder: ${year2Folder}`);

  //check if both years exist
  await yearsExist(year1Folder, year2Folder);
  //check college folders of both years
  await compareCollegeFolders(year1Folder, year2Folder);
  //check majors in each college folder
  let colleges : string[] = listFolders(year1Folder);
  console.log("DENIS",colleges)

};

diff(2022, 2023);

