import fs from 'fs';
import path from 'path';
import '@babel/polyfill';
import scraper from 'google-play-scraper';
import _ from 'lodash';
import chalk from 'chalk';
import dateFormat from 'dateformat-light';

// const collections = Object.values(scraper.collection);
const collections = [scraper.collection.TOP_FREE];

function getCategories() {
  return [
    'GAME_ACTION',
    'GAME_ADVENTURE',
    'GAME_ARCADE',
    'GAME_BOARD',
    'GAME_CARD',
    'GAME_CASINO',
    'GAME_CASUAL',
    'GAME_EDUCATIONAL',
    'GAME_MUSIC',
    'GAME_PUZZLE',
    'GAME_RACING',
    'GAME_ROLE_PLAYING',
    'GAME_SIMULATION',
    'GAME_SPORTS',
    'GAME_STRATEGY',
    'GAME_TRIVIA',
    'GAME_WORD',
    'FAMILY_ACTION',
    'FAMILY_BRAINGAMES',
    'FAMILY_CREATE',
    'FAMILY_EDUCATION',
    'FAMILY_MUSICVIDEO',
    'FAMILY_PRETEND'
  ]
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
    return await scraper.list({
      category,
      collection,
      fullDetail: true,
      num: 100,
      throttle: 1
    });
  } catch (error) {
    const message = `Error getting ${collection} collection under ${category} category:`;
    console.log(`['${collection}', '${category}']`);
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

function formatContents(apps) {
  let contents = '';
  apps.forEach(app => {
    if (contents) {
      contents = `${contents}\n`;
    }

    contents = `${contents}${JSON.stringify(app)}`;
  });

  return contents;
}

async function scrape() {
  try {
    const categories = getCategories();
    const combinations = getCartesianProductOf(collections, categories);
    console.log(combinations);
    const getAppsPromises = _.map(combinations, combination =>
      getApps(combination)
    );
    const results = await Promise.all(getAppsPromises);

    // Flatten results and dedupe by appId
    const apps = _.uniqBy(_.flatten(results), 'appId');
    const formattedContent = formatContents(apps);
    const filename = `${dateFormat(new Date(), 'yyyymmddHHMMssl')}.json`;
    const filepath = path.join(__dirname, '..', '/outputs/', filename);

    const writeResult = await writeToFile(filepath, formattedContent);
    console.log(`${chalk.reset(writeResult)}`);
  } catch (error) {
    console.error('Error during scraping:');
    console.error(`${chalk.reset(error)}`);
  }
}

scrape();
