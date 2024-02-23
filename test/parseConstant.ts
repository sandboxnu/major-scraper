import type { IAndCourse2, ICourseRange2, IRequiredCourse } from "@/types";
import { HRowType, type HRow } from "@/tokenize";

export const HEADER_TOKEN: HRow = {
  type: HRowType.HEADER,
  description: "Test Requirement",
  hour: 0,
};

export const PLAIN_COURSE_TOKEN: HRow = {
  type: HRowType.PLAIN_COURSE,
  description: "",
  classId: 2500,
  hour: 4,
  subject: "CS",
};

export const OR_COURSE_TOKEN: HRow = {
  type: HRowType.OR_COURSE,
  subject: "CS",
  hour: 1,
  classId: 2501,
  description: "",
};

export const PLAIN_COURSE_PARSED: IRequiredCourse = {
  type: "COURSE",
  classId: 2500,
  subject: "CS",
};

export const OR_COURSE_PARSED: IRequiredCourse = {
  type: "COURSE",
  classId: 2501,
  subject: "CS",
};

export const AND_COURSE_TOKEN: HRow = {
  hour: 5,
  type: HRowType.AND_COURSE,
  description: "",
  courses: [
    {
      subject: "CS",
      classId: 1800,
      description: "Discrete Structures",
    },
    {
      subject: "CS",
      classId: 1802,
      description: "Seminar for CS 1800",
    },
  ],
};

export const AND_COURSE_PARSED: IAndCourse2 = {
  type: "AND",
  courses: [
    {
      subject: "CS",
      classId: 1800,
      description: "Discrete Structures",
      type: "COURSE",
    },
    {
      subject: "CS",
      classId: 1802,
      description: "Seminar for CS 1800",
      type: "COURSE",
    },
  ],
};

export const RANGE_UNBOUNDED_TOKEN: HRow = {
  type: HRowType.RANGE_UNBOUNDED,
  hour: 0,
  subjects: ["ARTD", "ARTE", "ARTF", "ARTG", "ARTH", "GAME"],
};

export const RANGE_UNBOUNDED_PARSED: ICourseRange2[] = [
  {
    type: "RANGE",
    subject: "ARTD",
    idRangeStart: 0,
    idRangeEnd: 9999,
    exceptions: [],
  },
  {
    type: "RANGE",
    subject: "ARTE",
    idRangeStart: 0,
    idRangeEnd: 9999,
    exceptions: [],
  },
  {
    type: "RANGE",
    subject: "ARTF",
    idRangeStart: 0,
    idRangeEnd: 9999,
    exceptions: [],
  },
  {
    type: "RANGE",
    subject: "ARTG",
    idRangeStart: 0,
    idRangeEnd: 9999,
    exceptions: [],
  },
  {
    type: "RANGE",
    subject: "ARTH",
    idRangeStart: 0,
    idRangeEnd: 9999,
    exceptions: [],
  },
  {
    type: "RANGE",
    subject: "GAME",
    idRangeStart: 0,
    idRangeEnd: 9999,
    exceptions: [],
  },
];

export const RANGE_LOWER_BOUNDED_WITH_EXCEPTION_TOKEN: HRow = {
  type: HRowType.RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS,
  hour: 0,
  subject: "CS",
  classIdStart: 2500,
  exceptions: [
    {
      subject: "CS",
      classId: 5010,
    },
  ],
};

export const RANGE_LOWER_BOUNDED_WITH_EXCEPTION_PARSED: ICourseRange2 = {
  type: "RANGE",
  subject: "CS",
  idRangeStart: 2500,
  idRangeEnd: 9999,
  exceptions: [
    {
      subject: "CS",
      classId: 5010,
      type: "COURSE",
    },
  ],
};

export const RANGE_LOWER_BOUNDED_TOKEN: HRow = {
  type: HRowType.RANGE_LOWER_BOUNDED,
  hour: 0,
  subject: "BNSC",
  classIdStart: 4970,
};

export const RANGE_LOWER_BOUNDED_PARSED: ICourseRange2 = {
  type: "RANGE",
  subject: "BNSC",
  idRangeStart: 4970,
  idRangeEnd: 9999,
  exceptions: [],
};

export const RANGE_BOUNDED_TOKEN: HRow = {
  hour: 4,
  subject: "ARCH",
  classIdStart: 2300,
  classIdEnd: 2399,
  type: HRowType.RANGE_BOUNDED,
};

export const RANGE_BOUNDED_PARSED: ICourseRange2 = {
  type: "RANGE",
  subject: "ARCH",
  idRangeStart: 2300,
  idRangeEnd: 2399,
  exceptions: [],
};

export const RANGE_BOUNDED_WITH_EXCEPTIONS_TOKEN: HRow = {
  hour: 0,
  subject: "MATH",
  classIdStart: 3001,
  classIdEnd: 4999,
  type: HRowType.RANGE_BOUNDED_WITH_EXCEPTIONS,
  exceptions: [
    {
      subject: "MATH",
      classId: 4000,
    },
  ],
};

export const RANGE_BOUNDED_WITH_EXCEPTIONS_PARSED: ICourseRange2 = {
  type: "RANGE",
  subject: "MATH",
  idRangeStart: 3001,
  idRangeEnd: 4999,
  exceptions: [
    {
      subject: "MATH",
      classId: 4000,
      type: "COURSE",
    },
  ],
};

export const OR_OF_AND_COURSE_TOKEN: HRow = {
  hour: 0,
  type: HRowType.OR_OF_AND_COURSE,
  description: "General Biology 1 and Lab for BIOL 1111",
  courses: [
    {
      subject: "BIOL",
      classId: 1111,
      description: "General Biology 1",
    },
    {
      subject: "BIOL",
      classId: 1112,
      description: "Lab for BIOL 1111",
    },
  ],
};

export const OR_OF_AND_COURSE_PARSED: IAndCourse2 = {
  type: "AND",
  courses: [
    {
      subject: "BIOL",
      classId: 1111,
      description: "General Biology 1",
      type: "COURSE",
    },
    {
      subject: "BIOL",
      classId: 1112,
      description: "Lab for BIOL 1111",
      type: "COURSE",
    },
  ],
};
