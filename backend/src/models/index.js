import sequelize from "../config/database.js";
import ProspectModel from "./Prospect.js";
import TagModel from "./Tag.js";
import SourceScrapingModel from "./SourceScraping.js";

// Initialiser les modèles
const Prospect = ProspectModel(sequelize);
const Tag = TagModel(sequelize);
const SourceScraping = SourceScrapingModel(sequelize);

// Associations Prospect <-> Tag (many-to-many)
Prospect.belongsToMany(Tag, {
  through: "prospects_tags",
  foreignKey: "prospect_id",
  otherKey: "tag_id",
  as: "tags",
});

Tag.belongsToMany(Prospect, {
  through: "prospects_tags",
  foreignKey: "tag_id",
  otherKey: "prospect_id",
  as: "prospects",
});

// Associations Prospect <-> SourceScraping (many-to-many)
Prospect.belongsToMany(SourceScraping, {
  through: "prospects_sources",
  foreignKey: "prospect_id",
  otherKey: "source_id",
  as: "sources",
  timestamps: true, // Ajouter date_association
});

SourceScraping.belongsToMany(Prospect, {
  through: "prospects_sources",
  foreignKey: "source_id",
  otherKey: "prospect_id",
  as: "prospects",
  timestamps: true, // Ajouter date_association
});

export { sequelize, Prospect, Tag, SourceScraping };
