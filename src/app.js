import fs from 'fs';
import path from 'path';
import '@babel/polyfill';
import scraper from 'google-play-scraper';
import _ from 'lodash';
import chalk from 'chalk';
import dateFormat from 'dateformat-light';

const collections = Object.values(scraper.collection);

async function getCategories() {
  return await scraper.categories();
}

function getCartesianProductOf() {
  return _.reduce(
    arguments,
    (a, b) => {
      return _.flatten(
        _.map(a, x => {
          return _.map(b, y => {
            return x.concat([y]);
          });
        }),
        true
      );
    },
    [[]]
  );
}

async function getApps(criteria) {
  const collection = criteria[0];
  const category = criteria[1];
  console.log(`Getting ${collection} collection under ${category} category`);
  try {
    return await scraper.list({ category, collection });
  } catch (error) {
    const message = `Error getting ${collection} collection under ${category} category:`;
    console.error(`${chalk.red(message)}`);
    console.error(error);
    console.log('\n');
    return []; // Return empty array when not found, in order for others to proceed
  }
}

async function writeToFile(filepath, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, contents, error => {
      if (error) {
        return reject(error);
      }

      return resolve(`Successfully written data to ${filepath}`);
    });
  });
}

async function scrape() {
  try {
    const categories = await getCategories();
    const combinations = getCartesianProductOf(collections, categories);
    const getAppsPromises = _.map(combinations, combination =>
      getApps(combination)
    );
    const results = await Promise.all(getAppsPromises);

    // Flatten results and dedupe by appId
    const apps = _.uniqBy(_.flatten(results), 'appId');
    const filename = `${dateFormat(new Date(), 'yyyymmddHHMMssl')}.json`;
    const filepath = path.join(__dirname, '..', '/outputs/', filename);

    const writeResult = await writeToFile(
      filepath,
      JSON.stringify(apps, null, 2)
    );
    console.log(`${chalk.green(writeResult)}`);
  } catch (error) {
    console.error('Error during scraping:');
    console.error(error);
  }
}

scrape();
