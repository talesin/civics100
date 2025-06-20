# civics2json Project Plan

## Task List

- [x] Set up TypeScript project and dependencies
- [x] Implement CLI entry point and command structure
- [x] Implement fetch command to retrieve civics questions from USCIS
- [x] Implement parse command to convert fetched data into structured JSON
- [x] Write tests for fetch and parse logic
- [x] Document usage and commands in README
- [ ] Handle variable/location-dependent questions
  - [ ] Generate US senators by state: https://www.senate.gov/general/contact_information/senators_cfm.xml
  - [ ] Generate US representatives by state: https://www.house.gov/representatives
  - [ ] Retrieve and parse answers for the from questions on this page: https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates

## Purpose

Retrieve and parse the official USCIS civics questions from the USCIS website, and output them as structured JSON for use in study tools, practice tests, and other applications.

## Core Components

### A. Data Retrieval

- Fetch the official civics questions from the USCIS website using a CLI command.

### B. Data Parsing

- Parse the raw data into a structured, machine-readable JSON format.

### C. CLI Application

- Provide a command-line interface with clear commands for fetching and parsing.
