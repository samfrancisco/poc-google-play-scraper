import scraper from 'google-play-scraper';

async function getCategories() {
  const categories = await scraper.categories();
  console.log(categories);
}

getCategories();
