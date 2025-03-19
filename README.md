# GraduateNU Major Scraper

This repo houses [GraduateNU](https://github.com/sandboxnu/graduatenu)'s major requirements scraper. It scrapes the [Northeastern Academic Catalog](https://catalog.northeastern.edu/undergraduate/).

# Setup

Clone the repo and run:  
`pnpm install`

# Running

After installing dependencies, you can:

## Scrape Major Requirements
To scrape major requirements:  
`pnpm scrape`

## Scrape Plans of Study (Templates)
To scrape plans of study (templates):  
`pnpm scrape:templates`

## Scrape Both
To scrape both major requirements and templates:  
`pnpm scrape:all`

The scraper uses the current catalog by default, but you can specify one or more years as command line arguments. For example to scrape the catalog for 2021, 2022, and the current year, you'd write:  
`pnpm scrape 2021 2022 current`

This will populate:
- The `degrees` folder with parsed major requirement JSON files
- The `templates` folder with plan of study templates in JSON format
- The `catalogCache` folder with cached HTML files

## Output Structure

- Major requirements: `degrees/<degree-type>/<year>/<college>/<major-name>/`
- Templates: `templates/<year>/<college>/<major-name>/template.json`
