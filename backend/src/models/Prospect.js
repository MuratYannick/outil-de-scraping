import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Prospect = sequelize.define('Prospect', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom_entreprise: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    nom_contact: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    telephone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    adresse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url_site: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isUrl: true,
      },
    },
    source_scraping: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Manual',
    },
    date_ajout: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    date_modification: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'prospects',
    timestamps: false,
    underscored: true,
  });

  return Prospect;
};
