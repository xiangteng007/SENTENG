import AppDataSource from '../data-source';
import { seedCmmTaxonomy } from './cmm-taxonomy.seed';

const runSeeds = async () => {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected.');

    // Run seeds
    await seedCmmTaxonomy(AppDataSource);

    console.log('All seeds completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

runSeeds();
