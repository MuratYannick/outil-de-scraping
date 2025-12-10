import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Prospect = sequelize.define(
    "Prospect",
    {
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
      telephone_2: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      telephone_3: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      adresse: {
        type: DataTypes.STRING(500),
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
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        comment: "Latitude GPS (Google Maps)",
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        comment: "Longitude GPS (Google Maps)",
      },
      note: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: true,
        comment: "Note/avis (ex: 4.5/5)",
      },
      ville: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Ville extraite via geocoding inversé depuis GPS",
      },
      code_postal: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: "Code postal extrait via geocoding inversé depuis GPS",
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
    },
    {
      tableName: "prospects",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['nom_entreprise', 'adresse'],
          name: 'unique_entreprise_adresse'
        }
      ]
    }
  );

  return Prospect;
};
