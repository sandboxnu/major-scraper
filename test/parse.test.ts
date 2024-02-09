import { describe, expect, test } from "vitest";
import { parseRows } from "../src/parse";
import { type HRow } from "../src/tokenize";
import type { Requirement2 } from "../src/graduate-types";
import {
  AND_COURSE_PARSED,
  AND_COURSE_TOKEN,
  HEADER_TOKEN,
  OR_COURSE_PARSED,
  OR_COURSE_TOKEN,
  OR_OF_AND_COURSE_PARSED,
  OR_OF_AND_COURSE_TOKEN,
  PLAIN_COURSE_PARSED,
  PLAIN_COURSE_TOKEN,
  RANGE_BOUNDED_PARSED,
  RANGE_BOUNDED_TOKEN,
  RANGE_BOUNDED_WITH_EXCEPTIONS_PARSED,
  RANGE_BOUNDED_WITH_EXCEPTIONS_TOKEN,
  RANGE_LOWER_BOUNDED_PARSED,
  RANGE_LOWER_BOUNDED_TOKEN,
  RANGE_LOWER_BOUNDED_WITH_EXCEPTION_PARSED,
  RANGE_LOWER_BOUNDED_WITH_EXCEPTION_TOKEN,
  RANGE_UNBOUNDED_PARSED,
  RANGE_UNBOUNDED_TOKEN,
} from "test/parseConstant";

function expectReqs(tokens: HRow[], reqs: Requirement2[]) {
  expect(parseRows([HEADER_TOKEN, ...tokens])).toStrictEqual<Requirement2[]>([
    {
      type: "SECTION",
      title: "Test Requirement",
      requirements: reqs,
      minRequirementCount: reqs.length,
    },
  ]);
}

describe("parser", () => {
  test("course", () => {
    expectReqs(
      [PLAIN_COURSE_TOKEN, PLAIN_COURSE_TOKEN],
      [PLAIN_COURSE_PARSED, PLAIN_COURSE_PARSED],
    );
  });
  describe("orCourse", () => {
    test("single OR course", () => {
      expectReqs(
        [PLAIN_COURSE_TOKEN, OR_COURSE_TOKEN],
        [
          {
            type: "OR",
            courses: [PLAIN_COURSE_PARSED, OR_COURSE_PARSED],
          },
        ],
      );
    });

    test("should aggregate multiple consecutive OR course into one requirement", () => {
      expectReqs(
        [PLAIN_COURSE_TOKEN, OR_COURSE_TOKEN, OR_COURSE_TOKEN, OR_COURSE_TOKEN],
        [
          {
            type: "OR",
            courses: [
              PLAIN_COURSE_PARSED,
              OR_COURSE_PARSED,
              OR_COURSE_PARSED,
              OR_COURSE_PARSED,
            ],
          },
        ],
      );
    });

    test("AND course followed by an OR course", () => {
      expectReqs(
        [AND_COURSE_TOKEN, OR_COURSE_TOKEN],
        [
          {
            type: "OR",
            courses: [AND_COURSE_PARSED, OR_COURSE_PARSED],
          },
        ],
      );
    });

    test("AND course followed by an OR OF AND course", () => {
      expectReqs(
        [AND_COURSE_TOKEN, OR_OF_AND_COURSE_TOKEN],
        [
          {
            type: "OR",
            courses: [AND_COURSE_PARSED, OR_OF_AND_COURSE_PARSED],
          },
        ],
      );
    });
  });

  describe("andCourse", () => {
    test("single AND course", () => {
      expectReqs(
        [AND_COURSE_TOKEN, PLAIN_COURSE_TOKEN],
        [AND_COURSE_PARSED, PLAIN_COURSE_PARSED],
      );
    });

    test("multiple AND courses", () => {
      expectReqs(
        [AND_COURSE_TOKEN, AND_COURSE_TOKEN],
        [AND_COURSE_PARSED, AND_COURSE_PARSED],
      );
    });
  });

  describe("rangeCourse", () => {
    test("unbounded", () => {
      expectReqs([RANGE_UNBOUNDED_TOKEN], RANGE_UNBOUNDED_PARSED);
    });

    test("lower bounded", () => {
      expectReqs([RANGE_LOWER_BOUNDED_TOKEN], [RANGE_LOWER_BOUNDED_PARSED]);
    });

    test("lower bounded with exceptions", () => {
      expectReqs(
        [RANGE_LOWER_BOUNDED_WITH_EXCEPTION_TOKEN],
        [RANGE_LOWER_BOUNDED_WITH_EXCEPTION_PARSED],
      );
    });

    test("bounded", () => {
      expectReqs([RANGE_BOUNDED_TOKEN], [RANGE_BOUNDED_PARSED]);
    });

    test("bounded with exceptions", () => {
      expectReqs(
        [RANGE_BOUNDED_WITH_EXCEPTIONS_TOKEN],
        [RANGE_BOUNDED_WITH_EXCEPTIONS_PARSED],
      );
    });
  });
});
