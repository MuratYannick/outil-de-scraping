/**
 * Script de test pour vérifier la requête SQL raw
 */

import { sequelize } from '../src/models/index.js';
import { QueryTypes } from 'sequelize';

console.log('🧪 Test de la requête SQL raw\n');
console.log('═'.repeat(80));

async function testRawSQLPagination() {
  try {
    // Test SQL direct
    const query = `
      SELECT id
      FROM prospects
      ORDER BY date_ajout DESC
      LIMIT 10 OFFSET 0
    `;

    console.log('\n📄 SQL Query:');
    console.log(query);
    console.log('\n📄 PAGE 1 Results:');

    const page1 = await sequelize.query(query, { type: QueryTypes.SELECT });
    page1.forEach((row, i) => {
      console.log(`${i + 1}. ID:${row.id}`);
    });

    const query2 = `
      SELECT id
      FROM prospects
      ORDER BY date_ajout DESC
      LIMIT 10 OFFSET 10
    `;

    console.log('\n📄 PAGE 2 Results:');
    const page2 = await sequelize.query(query2, { type: QueryTypes.SELECT });
    page2.forEach((row, i) => {
      console.log(`${i + 1}. ID:${row.id}`);
    });

    // Check for duplicates
    const page1Ids = page1.map(r => r.id);
    const page2Ids = page2.map(r => r.id);
    const duplicates = page1Ids.filter(id => page2Ids.includes(id));

    console.log('\n🔍 VÉRIFICATION DES DOUBLONS');
    console.log('─'.repeat(80));

    if (duplicates.length > 0) {
      console.log(`❌ ${duplicates.length} doublon(s): ${duplicates.join(', ')}`);
      process.exit(1);
    } else {
      console.log('✅ Aucun doublon');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRawSQLPagination();
