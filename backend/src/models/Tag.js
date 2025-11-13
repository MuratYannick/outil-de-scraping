import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Tag = sequelize.define(
    "Tag",
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
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      tableName: "tags",
      timestamps: false,
      underscored: true,
    }
  );

  return Tag;
};
