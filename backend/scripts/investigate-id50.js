/**
 * Script pour investiguer l'ID 50
 */

import { sequelize, Prospect } from '../src/models/index.js';
import { QueryTypes } from 'sequelize';

console.log('🔍 Investigation de l\'ID 50\n');
console.log('═'.repeat(80));

async function investigate() {
  try {
    // 1. Compter combien de fois l'ID 50 existe
    const countQuery = `SELECT COUNT(*) as count FROM prospects WHERE id = 50`;
    const countResult = await sequelize.query(countQuery, { type: QueryTypes.SELECT });
    console.log(`\n1️⃣ Nombre d'occurrences de l'ID 50: ${countResult[0].count}`);

    // 2. Récupérer toutes les infos sur l'ID 50
    const prospect = await sequelize.query(
      `SELECT * FROM prospects WHERE id = 50`,
      { type: QueryTypes.SELECT }
    );

    console.log('\n2️⃣ Informations sur l\'ID 50:');
    console.log(JSON.stringify(prospect, null, 2));

    // 3. Vérifier s'il y a plusieurs lignes pour "La Cantina Cannes"
    const cantina = await sequelize.query(
      `SELECT id, nom_entreprise, adresse, date_ajout FROM prospects WHERE nom_entreprise LIKE '%Cantina%'`,
      { type: QueryTypes.SELECT }
    );

    console.log('\n3️⃣ Tous les prospects "Cantina":');
    cantina.forEach(p => {
      console.log(`   ID:${p.id} - ${p.nom_entreprise} - ${p.date_ajout}`);
    });

    // 4. Vérifier les tags
    const tags = await sequelize.query(
      `SELECT pt.prospect_id, pt.tag_id, t.nom as tag_nom
       FROM prospects_tags pt
       INNER JOIN tags t ON pt.tag_id = t.id
       WHERE pt.prospect_id = 50`,
      { type: QueryTypes.SELECT }
    );

    console.log('\n4️⃣ Tags pour l\'ID 50:');
    console.log(JSON.stringify(tags, null, 2));

    // 5. Tester la requête simple qui retourne l'ID 50
    const allIds = await sequelize.query(
      `SELECT id, nom_entreprise, date_ajout FROM prospects ORDER BY date_ajout DESC`,
      { type: QueryTypes.SELECT }
    );

    console.log('\n5️⃣ Tous les prospects triés par date (20 premiers):');
    allIds.slice(0, 20).forEach((p, i) => {
      console.log(`   ${i + 1}. ID:${p.id} - ${p.nom_entreprise} - ${p.date_ajout}`);
    });

    // 6. Chercher des doublons d'ID
    const duplicates = await sequelize.query(
      `SELECT id, COUNT(*) as count FROM prospects GROUP BY id HAVING count > 1`,
      { type: QueryTypes.SELECT }
    );

    console.log('\n6️⃣ IDs en double:');
    if (duplicates.length === 0) {
      console.log('   Aucun ID en double');
    } else {
      duplicates.forEach(d => {
        console.log(`   ID:${d.id} apparaît ${d.count} fois`);
      });
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

investigate();
