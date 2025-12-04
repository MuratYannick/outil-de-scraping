import { DataTypes } from "sequelize";

/**
 * Modèle SourceScraping
 * Représente les différentes sources de scraping (Pages Jaunes, Google Maps, LinkedIn, Manual, etc.)
 */
export default (sequelize) => {
  const SourceScraping = sequelize.define(
    "SourceScraping",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: "Nom de la source (ex: 'Pages Jaunes', 'Google Maps', 'LinkedIn', 'Manual')",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Description optionnelle de la source",
      },
      couleur: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: "#3B82F6",
        comment: "Couleur hex pour affichage frontend (ex: #FF5733)",
      },
      actif: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Indique si la source est active ou désactivée",
      },
      date_creation: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "sources_scraping",
      timestamps: false,
      underscored: true,
    }
  );

  return SourceScraping;
};
