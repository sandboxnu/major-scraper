import { describe, expect, test } from "vitest";
import { parseRows, parseTokens } from "@/parse";
import { type HRow, type HSection } from "@/tokenize";
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
  SUBHEADER_TOKEN,
  X_OF_MANY_TOKEN,
} from "test/parseConstant";
import type { Requirement2 } from "@/types";
import {
  ARCH_ENGLISH_2022,
  BIOENG_BIOCHEM_2022,
  CHEMICAL_ENG_2022,
  CS_BSCS_2022,
  CS_BUSINESS_ADMIN_2022,
  CS_ENGLISH_2023,
  CS_HISTORY_2022,
  CS_MATH_2022,
  CS_MUSIC_2023,
  HUMAN_SERVICE_INTER_AFFAIRS_2023,
  MEDIA_SCREEN_STUDIES_HISTORY_2022,
  PHYSICS_2022,
  formatParsePath,
  formatTokenPath,
} from "test/testUrls";
import { readFile } from "fs/promises";

function expectReqs(testName: string, tokens: HRow[], reqs: Requirement2[]) {
  test(testName, () => {
    expect(parseRows("", [HEADER_TOKEN, ...tokens])).toStrictEqual<
      Requirement2[]
    >([
      {
        type: "SECTION",
        title: "Test Requirement",
        requirements: reqs,
        minRequirementCount: reqs.length,
      },
    ]);
  });
}

function testParse(testName: string, tokens: HRow[], reqs: Requirement2[]) {
  test(testName, () => {
    expect(parseRows("", tokens)).toStrictEqual<Requirement2[]>(reqs);
  });
}

async function testParseSnapshot(testName: string, fileName: string) {
  const json = JSON.parse(
    await readFile(`./test/tokenized/${fileName}.json`, "utf-8"),
  ) as { sections: HSection[] };

  test(testName, async () => {
    await expect(
      JSON.stringify(parseTokens(json.sections), null, 2),
    ).toMatchFileSnapshot(formatParsePath(fileName));
  });
}

describe("Parse Phase: Unit tests", () => {
  expectReqs(
    "course",
    [PLAIN_COURSE_TOKEN, PLAIN_COURSE_TOKEN],
    [PLAIN_COURSE_PARSED, PLAIN_COURSE_PARSED],
  );

  describe("orCourse", () => {
    expectReqs(
      "single OR course",
      [PLAIN_COURSE_TOKEN, OR_COURSE_TOKEN],
      [
        {
          type: "OR",
          courses: [PLAIN_COURSE_PARSED, OR_COURSE_PARSED],
        },
      ],
    );

    expectReqs(
      "aggregate multiple consecutive OR course into one requirement",
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

    expectReqs(
      "AND course followed by an OR course",
      [AND_COURSE_TOKEN, OR_COURSE_TOKEN],
      [
        {
          type: "OR",
          courses: [AND_COURSE_PARSED, OR_COURSE_PARSED],
        },
      ],
    );

    expectReqs(
      "AND course followed by an OR OF AND course",
      [AND_COURSE_TOKEN, OR_OF_AND_COURSE_TOKEN],
      [
        {
          type: "OR",
          courses: [AND_COURSE_PARSED, OR_OF_AND_COURSE_PARSED],
        },
      ],
    );
  });

  describe("andCourse", () => {
    expectReqs(
      "single AND course",
      [AND_COURSE_TOKEN, PLAIN_COURSE_TOKEN],
      [AND_COURSE_PARSED, PLAIN_COURSE_PARSED],
    );

    expectReqs(
      "multiple AND courses",
      [AND_COURSE_TOKEN, AND_COURSE_TOKEN],
      [AND_COURSE_PARSED, AND_COURSE_PARSED],
    );
  });

  describe("rangeCourse", () => {
    expectReqs("unbounded", [RANGE_UNBOUNDED_TOKEN], RANGE_UNBOUNDED_PARSED);

    expectReqs(
      "lower bounded",
      [RANGE_LOWER_BOUNDED_TOKEN],
      [RANGE_LOWER_BOUNDED_PARSED],
    );

    expectReqs(
      "lower bounded with exceptions",
      [RANGE_LOWER_BOUNDED_WITH_EXCEPTION_TOKEN],
      [RANGE_LOWER_BOUNDED_WITH_EXCEPTION_PARSED],
    );

    expectReqs("bounded", [RANGE_BOUNDED_TOKEN], [RANGE_BOUNDED_PARSED]);

    expectReqs(
      "bounded with exceptions",
      [RANGE_BOUNDED_WITH_EXCEPTIONS_TOKEN],
      [RANGE_BOUNDED_WITH_EXCEPTIONS_PARSED],
    );
  });

  describe("X of Many", () => {
    expectReqs(
      "no token before XOM token",
      [
        X_OF_MANY_TOKEN,
        PLAIN_COURSE_TOKEN,
        AND_COURSE_TOKEN,
        RANGE_BOUNDED_TOKEN,
        RANGE_BOUNDED_WITH_EXCEPTIONS_TOKEN,
      ],
      [
        {
          type: "XOM",
          numCreditsMin: 8,
          courses: [
            PLAIN_COURSE_PARSED,
            AND_COURSE_PARSED,
            RANGE_BOUNDED_PARSED,
            RANGE_BOUNDED_WITH_EXCEPTIONS_PARSED,
          ],
        },
      ],
    );

    expectReqs(
      "some token before XOM token",
      [
        PLAIN_COURSE_TOKEN,
        AND_COURSE_TOKEN,
        X_OF_MANY_TOKEN,
        PLAIN_COURSE_TOKEN,
        AND_COURSE_TOKEN,
        RANGE_BOUNDED_TOKEN,
        RANGE_BOUNDED_WITH_EXCEPTIONS_TOKEN,
      ],
      [
        PLAIN_COURSE_PARSED,
        AND_COURSE_PARSED,
        {
          type: "XOM",
          numCreditsMin: 8,
          courses: [
            PLAIN_COURSE_PARSED,
            AND_COURSE_PARSED,
            RANGE_BOUNDED_PARSED,
            RANGE_BOUNDED_WITH_EXCEPTIONS_PARSED,
          ],
        },
      ],
    );
  });

  describe("subsections", () => {
    testParse(
      "no section info and courses before subsection",
      [
        HEADER_TOKEN,
        SUBHEADER_TOKEN,
        AND_COURSE_TOKEN,
        PLAIN_COURSE_TOKEN,
        SUBHEADER_TOKEN,
        PLAIN_COURSE_TOKEN,
        RANGE_BOUNDED_TOKEN,
      ],
      [
        {
          type: "SECTION",
          title: "Test Requirement",
          requirements: [
            {
              type: "SECTION",
              title: "Subheader Token",
              requirements: [AND_COURSE_PARSED, PLAIN_COURSE_PARSED],
              minRequirementCount: 2,
            },
            {
              type: "SECTION",
              title: "Subheader Token",
              requirements: [PLAIN_COURSE_PARSED, RANGE_BOUNDED_PARSED],
              minRequirementCount: 2,
            },
          ],
          minRequirementCount: 2,
        },
      ],
    );

    testParse(
      "courses before subsections",
      [
        HEADER_TOKEN,
        PLAIN_COURSE_TOKEN,
        AND_COURSE_TOKEN,
        RANGE_BOUNDED_WITH_EXCEPTIONS_TOKEN,
        SUBHEADER_TOKEN,
        AND_COURSE_TOKEN,
        PLAIN_COURSE_TOKEN,
        SUBHEADER_TOKEN,
        PLAIN_COURSE_TOKEN,
        RANGE_BOUNDED_TOKEN,
      ],
      [
        {
          type: "SECTION",
          title: "Test Requirement",
          requirements: [
            PLAIN_COURSE_PARSED,
            AND_COURSE_PARSED,
            RANGE_BOUNDED_WITH_EXCEPTIONS_PARSED,
            {
              type: "SECTION",
              title: "Subheader Token",
              requirements: [AND_COURSE_PARSED, PLAIN_COURSE_PARSED],
              minRequirementCount: 2,
            },
            {
              type: "SECTION",
              title: "Subheader Token",
              requirements: [PLAIN_COURSE_PARSED, RANGE_BOUNDED_PARSED],
              minRequirementCount: 2,
            },
          ],
          minRequirementCount: 5,
        },
      ],
    );
  });
});

describe("Parse Phase: 2022 Snapshots", async () => {
  await testParseSnapshot(
    "Computer Science BSCS (science requirements)",
    CS_BSCS_2022,
  );

  await testParseSnapshot(
    "CS & Business (nested linked concentration page)",
    CS_BUSINESS_ADMIN_2022,
  );
  await testParseSnapshot("Physics (3 courses per AND)", PHYSICS_2022);
  await testParseSnapshot(
    "Media screen & study history (range bounded)",
    MEDIA_SCREEN_STUDIES_HISTORY_2022,
  );
  await testParseSnapshot(
    "CS and Math (range bounded with exceptions)",
    CS_MATH_2022,
  );
  await testParseSnapshot(
    "CS and History (range lower bounded)",
    CS_HISTORY_2022,
  );
  await testParseSnapshot(
    "Chemical Engineering (range unbounded)",
    CHEMICAL_ENG_2022,
  );
  await testParseSnapshot("Bioeng Biochem (Or of ANDs)", BIOENG_BIOCHEM_2022);
  await testParseSnapshot(
    "Architecture and English (no tabs)",
    ARCH_ENGLISH_2022,
  );
});

describe("Parse Phase: 2023 Snapshots", async () => {
  await testParseSnapshot(
    "CS and Music (section info phrasing in middle of a section)",
    CS_MUSIC_2023,
  );

  await testParseSnapshot(
    "CS and English (subsubsection aka subsection with indentation)",
    CS_ENGLISH_2023,
  );

  await testParseSnapshot(
    "Human Service and International Affairs (separated section info and course tables)",
    HUMAN_SERVICE_INTER_AFFAIRS_2023,
  );
});
