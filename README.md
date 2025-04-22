# GraduateNU Major Scraper

This repo houses [GraduateNU](https://github.com/sandboxnu/graduatenu)'s major requirements scraper. It scrapes the [Northeastern Academic Catalog](https://catalog.northeastern.edu/undergraduate/).

# Setup

Clone the repo and run:  
`pnpm install`

# Running

After install in dependencies you can run the scraper with:  
`pnpm scrape`.

The scraper scrapes the current catalog by default, but you can specify one or more years for it to scrape as command line arguments. For example to scrape the catalog for 2021, 2022, and the current year, you'd write the following:  
`pnpm scrape 2021 2022 current`

This will populate the `results` folder with parsed JSON files and the catalogCache folder with cached HTML.

There is a separate command that can scrape a single academic catalog log by providing a link. To do that, run the following:  
`pnpm scrape-link <link>`