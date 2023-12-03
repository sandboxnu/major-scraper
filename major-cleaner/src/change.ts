import {
  IAndCourse2,
  ICourseRange2,
  IOrCourse2,
  IRequiredCourse,
  IXofManyCourse,
  Requirement2,
  Section,
} from "../../src/graduate-types/major2";
import { MajorChange } from "./types";

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
        section.title = change.newSection.title;
      } else if (change.type === "type") {
        if (change.newType === "OR" || change.newType === "AND") {
          section.requirements[change.location] = {
            type: change.newType,
            courses: change.courses,
          };
        } else if (change.newType === "XOM") {
          section.requirements[change.location] = {
            type: change.newType,
            courses: change.courses,
            numCreditsMin: 0,
          };
        }
      } else if (change.type === "DELETE") {
        console.log("hereeee", change.location);
        section.requirements.splice(change.location, 1);
      } else if (change.type === "ADD_COURSE") {
        section.requirements.push({ type: "COURSE", classId: 0, subject: "" });
      }      else if (change.type === "ADD_GROUP") {
        section.requirements.push({ type: "AND", courses: [] });
      }
    },
  );

const handleRequirement = (
  requirement: Requirement2,
  change: MajorChange,
  location: number[],
) => {
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

const handleAnd = (and: IAndCourse2, change: MajorChange, location: number[]) =>
  hasMoreLocations(
    location,
    (nextLocation) =>
      handleRequirement(and.courses[nextLocation], change, location),
    () => {
      if (change.type === "DELETE") {
        console.log("hereeee", change.location);
        and.courses.splice(change.location, 1);
      } else if (change.type === "ADD_COURSE") {
        and.courses.push({ type: "COURSE", classId: 0, subject: "" });
      }      else if (change.type === "ADD_GROUP") {
        and.courses.push({ type: "AND", courses: [] });
      }
    },
  );

function handleCourse(
  requirement: IRequiredCourse,
  change: MajorChange,
  location: number[],
) {
  if (change.type === "COURSE") {
    requirement.subject = change.newCourse.subject;
    requirement.classId = change.newCourse.classId;
  }
}

function handleOr(or: IOrCourse2, change: MajorChange, location: number[]) {
  hasMoreLocations(
    location,
    (nextLocation) =>
      handleRequirement(or.courses[nextLocation], change, location),
    () => {
      if (change.type === "DELETE") {
        console.log("hereeee", change.location);
        or.courses.splice(change.location, 1);
      } else if (change.type === "ADD_COURSE") {
        or.courses.push({ type: "COURSE", classId: 0, subject: "" });
      }      else if (change.type === "ADD_GROUP") {
        or.courses.push({ type: "AND", courses: [] });
      }
    },
  );
}

function handleXom(
  xom: IXofManyCourse,
  change: MajorChange,
  location: number[],
) {
  hasMoreLocations(
    location,
    (nextLocation) =>
      handleRequirement(xom.courses[nextLocation], change, location),
    () => {
      if (change.type === "DELETE") {
        console.log("hereeee", change.location);
        xom.courses.splice(change.location, 1);
      } else if (change.type === "ADD_COURSE") {
        xom.courses.push({ type: "COURSE", classId: 0, subject: "" });
      }
      else if (change.type === "ADD_GROUP") {
        xom.courses.push({ type: "AND", courses: [] });
      }
    },
  );
}

function handleRange(
  requirement: ICourseRange2,
  change: MajorChange,
  location: number[],
) {
  throw new Error("wtf");
}
