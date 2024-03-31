import { intro, outro } from "@clack/prompts";
import { readFileSync, readdirSync, accessSync, constants } from "fs";
import type { Major2 } from "@/types";

import { compareMajors } from "./compareMajor";
import { logError, logSuccess } from "./util";


intro('Hello!')

const rootDir = 'degrees/Major'

const years = readdirSync(rootDir, { encoding: 'utf8' })
for (let year of years) {
    const yearDir = rootDir + '/' + year;
    const subjects = readdirSync(yearDir, { encoding: 'utf8' })
    for (let subject of subjects) {
        const subjectDir = yearDir + '/' + subject
        const majors = readdirSync(subjectDir, { encoding: 'utf8' })
        for (let major of majors) {
            const majorDir = subjectDir + '/' + major
            const parsedFile = majorDir + '/parsed.initial.json'
            const prodFile = majorDir + '/parsed.commit.json'
            try {
                accessSync(parsedFile, constants.R_OK)
                accessSync(prodFile, constants.R_OK)
                const parsedJSON = readFileSync(parsedFile, { encoding: 'utf8', flag: 'r' })
                const prodJSON = readFileSync(prodFile, { encoding: 'utf8', flag: 'r' })
                const ret = compareMajors(JSON.parse(parsedJSON) as Major2 , JSON.parse(prodJSON) as Major2)
                if (ret) {
                    logSuccess('Success! Majors are the same.')
                } else {
                    logError('Majors are not the same :(')
                }
            } catch (err) {
                logError(`Unable to compare JSONs in ${majorDir}.`)
            }
        }
    }
}

outro('Bye!')
