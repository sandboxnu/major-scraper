import { intro, log, outro } from "@clack/prompts";
import color from "picocolors";
import {scrapeLink } from "@/runtime";
import { fatalError } from "@/utils";

intro(color.inverse(" Welcome to Major Scraper "));

let args = process.argv.slice(2);
if (args.length != 1) {
    fatalError(
        `There should a single argument for the URL to scrape!`,
    );
} 

const link: string = args[0] || "";

if (link === "") {
    fatalError(
        `There should be an non-empty string URL!`,
    );
}

log.info(`Scraping the link: ${link}`);

await scrapeLink(new URL(link));

outro("Finished scraping!");
