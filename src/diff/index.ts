
import { fetchHTML } from '@/utils';
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

// list all majors in a folder
const listMajors = (yearFolder:string ,collegeFolders: string[],year:number) : Array<string> => {
  const table = new Map();
  const majorList = new Array();
  
  for (const college of collegeFolders) {
    const collegePath = path.join(yearFolder, college);
    const majors = fs.readdirSync(collegePath);
    table.set(`${year}/${college}`,majors.length)
    for (const major of majors) {
      // check inside of file in 
      const file = path.join(collegePath, major, "parsed.initial.json");
      if (!fs.existsSync(file)) {
        console.log(`${file} does not exist`);
        continue;
      }
      majorList.push(path.join(college, major));
    }
  }
  console.table(table)
  return majorList;
}

// check catalog to make sure link doesnt work
const check404 = async(missingMajors:string[], y:number) => {
  const promises = missingMajors.map(async (missingMajor) => {
    const url = `https://catalog.northeastern.edu/archive/${y}-${y+1}/undergraduate/${missingMajor}`;
    try{
      const res = await fetch(url);
      //console.log(res.status);
      if(res.status == 404) {
        //console.log(url);
      }else{
        console.log("RAAAA", url);
      }
    } catch(e){
      console.error(`error fetching ${url}`)
    }
    //console.log(url);
  });
  await Promise.all(promises);
}


// get major folder diffs between the years  
const compareYear = async (y1Majors:string[], y2Majors:string[], y1:number, y2:number) : Promise<[string[],string[]]> =>  {
  // courses from year 1 that arent in year 2
  const y2Missing = y1Majors.filter((e) => !y2Majors.includes(e));
  // courses from year 2 tat arent in year 1
  const y1Missing = y2Majors.filter((e) => !y1Majors.includes(e));

  console.log (`${y1} is missing ${y1Missing.length} majors in ${y2}:`)
  //double check that the page isnt missing from the website
  await check404(y1Missing,y1);

  console.log (`${y2} is missing ${y2Missing.length} majors in ${y1}:`)
  // double check that the page isn't missing from the website
  await check404(y2Missing,y2);

  return [y1Missing,y2Missing];
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
  //console.log("DENIS",colleges)
  // now check every major in each college , make sure it has initial.parsed.json in it
  let y1Majors = listMajors(year1Folder, colleges, year1);
  let y2Majors = listMajors(year2Folder, colleges, year2);

  let [y1Missing, y2Missing] = await compareYear(y1Majors, y2Majors , year1, year2);
  
  //do we want to do anything else after making sure the different majors aren't in the neu course catalog? 
};

diff(2022, 2023);
//let x = await fetch("https://catalog.northeastern.edu/archive/2022-2023/undergraduate/arts-media-design/journalism_and_communication_studies_ba")
//console.log(x.status)
