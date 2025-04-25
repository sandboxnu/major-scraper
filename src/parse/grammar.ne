@preprocessor typescript

@{%
// define custom tokens
// basically just check against the HRowType enum value
const HEADER = { test: x => x.type === "HEADER" };
const SUBHEADER = { test: x => x.type === "SUBHEADER" };
const COMMENT = { test: x => x.type === "COMMENT" };
const SECTION_INFO = { test: x => x.type === "SECTION_INFO" };
const POTENTIAL_CONCENTRATION_ERROR = { test: x => x.type === "POTENTIAL_CONCENTRATION_ERROR" };

const OR_COURSE = { test: x => x.type === "OR_COURSE" };
const OR_OF_AND_COURSE = { test: x => x.type === "OR_OF_AND_COURSE" };

const AND_COURSE = { test: x => x.type === "AND_COURSE" };

const PLAIN_COURSE = { test: x => x.type === "PLAIN_COURSE" };

const RANGE_LOWER_BOUNDED = { test: x => x.type === "RANGE_LOWER_BOUNDED" };
const RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS = { test: x => x.type === "RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS" };
const RANGE_BOUNDED = { test: x => x.type === "RANGE_BOUNDED" };
const RANGE_BOUNDED_WITH_EXCEPTIONS = { test: x => x.type === "RANGE_BOUNDED_WITH_EXCEPTIONS" };
const RANGE_UNBOUNDED = { test: x => x.type === "RANGE_UNBOUNDED" };

const X_OF_MANY = { test: x => x.type === "X_OF_MANY" };
%}

@{%
// import postprocessors
import postprocess from "./postprocess";
%}

# main entrypoint
main -> requirement2_section:+                             {% id %}

requirement2_section ->
    %HEADER top_level_requirement2_list                    {% postprocess.processSection %}
  | %HEADER %SECTION_INFO top_level_requirement2_list      {% postprocess.processSectionWithInfo %}
  | %HEADER subsection:+                                   {% postprocess.processSubsections %}
  | %HEADER %SECTION_INFO subsection:+                     {% postprocess.processSubsectionsWithInfo %}
  | %HEADER requirement2_list subsection:+                 {% postprocess.processSectionWithSubsections %}
  | %HEADER                                                {% postprocess.processEmptySection %}
  | %POTENTIAL_CONCENTRATION_ERROR requirement2_section    {% postprocess.processConcentrationError %}

subsection ->
    %SUBHEADER top_level_requirement2_list                 {% postprocess.processSection %}
  | %SUBHEADER %SECTION_INFO top_level_requirement2_list   {% postprocess.processSectionWithInfo %}
  | %SUBHEADER                                             {% postprocess.processEmptySection %}

top_level_requirement2_list ->
    requirement2_list xom:+                                {% tokens => tokens.flat() %}
  | requirement2_list                                      {% id %}
  | xom:+                                                  {% id %}

xom -> 
  %X_OF_MANY requirement2_list                             {% postprocess.processXOM %}

requirement2_list ->
  ( course                                                 {% id %}
  | range                                                  {% id %}
  | orCourse                                               {% id %}
  | andCourse                                              {% id %}
  ):+                                                      {% id %}

# atoms
orCourse ->
  ( course                                                 {% id %}
  | andCourse                                              {% id %}
  )
  ( %OR_COURSE                                             {% postprocess.processCourse %}
  | %OR_OF_AND_COURSE                                      {% postprocess.processOrOfAnd %}
  ) :+                                                     {% postprocess.processOr %}

andCourse -> 
  %AND_COURSE                                              {% postprocess.processOrOfAnd %}

course -> %PLAIN_COURSE                                    {% postprocess.processCourse %}

range ->
    %RANGE_LOWER_BOUNDED                                   {% postprocess.processRangeLB %}
  | %RANGE_LOWER_BOUNDED_WITH_EXCEPTIONS                   {% postprocess.processRangeLBE %}
  | %RANGE_BOUNDED                                         {% postprocess.processRangeB %}
  | %RANGE_BOUNDED_WITH_EXCEPTIONS                         {% postprocess.processRangeBE %}
  | %RANGE_UNBOUNDED                                       {% postprocess.processRangeU %}