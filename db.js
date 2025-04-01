const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://questions_62jb_user:VAYdHDDBDpRMlmoWdhqbAQmYF2bcszU2@dpg-cvlt3t15pdvs739c33v0-a.oregon-postgres.render.com/questions_62jb',
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;