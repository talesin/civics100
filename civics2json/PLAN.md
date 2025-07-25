# civics2json Project Plan

## Task List

- [x] Set up TypeScript project and dependencies
- [x] Implement CLI entry point and command structure
- [x] Implement fetch command to retrieve civics questions from USCIS
- [x] Implement parse command to convert fetched data into structured JSON
- [x] Write tests for fetch and parse logic
- [x] Document usage and commands in README
- [ ] Handle variable/location-dependent questions
  - [x] Generate US senators by state: https://www.senate.gov/general/contact_information/senators_cfm.xml
  - [x] Generate US representatives by state: https://www.house.gov/representatives
  - [x] Generate US governors by state: https://www.usa.gov/state-governments
  - [x] Generate state capitals by state: https://www.usa.gov/state-governments
  - [x] Retrieve and parse answers for the variable questions on this page: https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates
    - [x] 20. Who is one of your state's U.S. Senators now?
    - [x] 23. Name your U.S. Representative.
    - [x] 28. What is the name of the President of the United States now?
    - [x] 29. What is the name of the Vice President of the United States now?
    - [x] 39. How many justices are on the Supreme Court?
    - [x] 40. Who is the Chief Justice of the United States now?
    - [x] 43. Who is the Governor of your state now?
    - [x] 46. What is the political party of the President now?
    - [x] 47. What is the name of the Speaker of the House of Representatives now?
    - [x] 100. Name two national U.S. holidays.

## Purpose

Retrieve and parse the official USCIS civics questions from the USCIS website, and output them as structured JSON for use in study tools, practice tests, and other applications.

## Core Components

### Senators and Representatives Pipeline (High-Level Steps)

#### 1. Retrieve (Fetch)

- **Check local cache:**
  - If the local file (XML for senators, HTML for representatives) exists and force-fetch is not specified, use the local file.
  - Otherwise, fetch the latest data from the remote source (Senate/House website).
  - Save the fetched data to the local file for future use.

#### 2. Parse

- **Transform raw data:**
  - Parse the XML (senators) or HTML (representatives) file into structured JavaScript objects.
  - Use schema validation to ensure data integrity (e.g., correct states, required fields present).
  - Handle edge cases (e.g., territories, missing/extra columns, unknown states) with appropriate logging and skipping.

#### 3. Write

- **Output structured data:**
  - Write the parsed and validated array of senators or representatives to a JSON file in the data directory.
  - This file is used by downstream tools and tests.

#### 4. Important Conditionals & Error Handling

- If the remote fetch fails, log an error and abort the pipeline.
- If parsing fails schema validation, log details and skip invalid rows.
- If the number of parsed members is unexpected (not 100 senators, not 435 reps + 6 delegates/commissioners), log a warning.
- Always prefer local cache unless force-fetch is explicitly requested.

---

### State Governors Pipeline (High-Level Steps)

#### 1. Retrieve (Fetch State Links)

- **Fetch the state governments index:**
  - Download the HTML from https://www.usa.gov/state-governments
  - Parse the page to extract links to each state government website or governor's office page.
  - If a local cache exists and force-fetch is not specified, use the cached HTML file.

#### 2. For Each State: Fetch Governor Page

- **Iterate over state links:**
  - For each state, fetch the destination page (may be the state government homepage or a direct governor's office page).
  - Cache each fetched page locally for reproducibility and to avoid repeated requests.
  - If a local copy exists and force-fetch is not specified, use the cache.

#### 3. Parse Governor Name

- **Extract governor information:**
  - Parse each destination page to extract the governor's name.
  - Use heuristics, selectors, or regexes as needed (since page structure will vary by state).
  - Normalize and validate the extracted names and state associations.
  - Log or flag any states where the governor could not be reliably extracted.

#### 4. Write

- **Output structured data:**
  - Write the array of `{ state, governor }` objects to a JSON file in the data directory.
  - This file is used by downstream tools and tests.

#### 5. Important Conditionals & Error Handling

- If the index fetch or any state fetch fails, log an error and continue or retry as appropriate.
- If parsing fails for a state, log a warning and optionally flag for manual review.
- Always prefer local cache unless force-fetch is explicitly requested.
- Consider rate-limiting or delays between requests to avoid overwhelming state servers.

---

### A. Data Retrieval

- Fetch the official civics questions from the USCIS website using a CLI command.
- Fetch US senators by state: https://www.senate.gov/general/contact_information/senators_cfm.xml
- Fetch US representatives by state: https://www.house.gov/representatives
- Fetch US governors by state: https://www.usa.gov/state-governments
- Fetch answers for the from questions on this page: https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates

### B. Data Parsing

- Parse the raw data into a structured, machine-readable JSON format.

### C. CLI Application

- Provide a command-line interface with clear commands for fetching and parsing.
