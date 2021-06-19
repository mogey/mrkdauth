import Sequelize from "sequelize";
const { DataTypes } = Sequelize;

const UserModel = (instance) =>
  instance.define("User", {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    createdOn: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    lastLoggedIn: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

export { UserModel };
