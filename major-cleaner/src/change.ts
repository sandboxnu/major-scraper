import {
  IAndCourse2,
  ICourseRange2,
  IOrCourse2,
  IRequiredCourse,
  IXofManyCourse,
  Requirement2,
  Section,
} from "../../src/graduate-types/major2";
import { CourseChange, MajorChange } from "./types";

const hasMoreLocations = (
  location: number[],
  handleMore: (nextLocation: number) => void,
  handleNone: () => void,
) => {
  if (location.length > 0) {
    const locationIndex = location.shift()!;
    handleMore(locationIndex);
  } else {
    handleNone();
  }
};

export const handleSection = (
  section: Section,
  change: MajorChange,
  location: number[],
) => 
  hasMoreLocations(
    location,
    (nextLocation) =>
      handleRequirement(section.requirements[nextLocation], change, location),
    () => {
      if (change.type === "SECTION") {
        section.title = change.newSection.title
      } else if (change.type === "type") {
        if(change.newType === "OR" || change.newType === "AND") {
          section.requirements[change.location] = {type: change.newType, courses: change.courses}
        }
      }
    },
  );


const handleRequirement = (
  requirement: Requirement2,
  change: MajorChange,
  location: number[],
) => {
    console.log(location);
  switch (requirement.type) {
    case "AND":
      handleAnd(requirement, change, location);
      break;
    case "COURSE":
      handleCourse(requirement, change, location);
      break;
    case "OR":
      handleOr(requirement, change, location);
      break;
    case "RANGE":
      handleRange(requirement, change, location);
      break;
    case "SECTION":
      handleSection(requirement, change, location);
      break;
    case "XOM":
      handleXom(requirement, change, location);
      break;
    default:
      throw new Error("what the fuck");
  }
};

const handleAnd = (
  and: IAndCourse2,
  change: MajorChange,
  location: number[],
) => hasMoreLocations(location, nextLocation => handleRequirement(and.courses[nextLocation], change, location), () => {
  
});

function handleCourse(
  requirement: IRequiredCourse,
  change: CourseChange,
  location: number[],
) {
    requirement.subject = change.newCourse.subject;
    requirement.classId = change.newCourse.classId;
}

function handleOr(
  requirement: IOrCourse2,
  change: CourseChange,
  location: number[],
) {
    hasMoreLocations(location, nextLocation => handleRequirement(requirement.courses[nextLocation], change, location), () => {});
}

function handleXom(
  requirement: IXofManyCourse,
  change: CourseChange,
  location: number[],
) {
    hasMoreLocations(location, nextLocation => handleRequirement(requirement.courses[nextLocation], change, location), () => {});
}

function handleRange(
  requirement: ICourseRange2,
  change: CourseChange,
  location: number[],
) {
    throw new Error("wtf");
}
