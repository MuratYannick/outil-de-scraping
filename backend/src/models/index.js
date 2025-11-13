import sequelize from '../config/database.js';
import ProspectModel from './Prospect.js';
import TagModel from './Tag.js';

// Initialiser les modèles
const Prospect = ProspectModel(sequelize);
const Tag = TagModel(sequelize);

// Associations
Prospect.belongsToMany(Tag, {
  through: 'prospects_tags',
  foreignKey: 'prospect_id',
  otherKey: 'tag_id',
  as: 'tags',
});

Tag.belongsToMany(Prospect, {
  through: 'prospects_tags',
  foreignKey: 'tag_id',
  otherKey: 'prospect_id',
  as: 'prospects',
});

export { sequelize, Prospect, Tag };
