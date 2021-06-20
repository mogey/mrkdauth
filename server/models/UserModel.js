import Sequelize from "sequelize";
const { DataTypes } = Sequelize;

const UserModel = (instance) =>
  instance.define("User", {
    id: {
      type: DataTypes.UUID,
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

const createUser = async (model, username, password, email) => {
  return await model.create({
    username: username,
    password: password,
    email: email,
  });
};

const findUserByID = async (model, id) => {
  return await model.findOne({ where: { id: id } });
};

const findUserByUsername = async (model, username) => {
  return await model.findOne({ where: { username: username } });
};

const findUserByEmail = async (model, email) => {
  return await model.findOne({ where: { email: email } });
};

const updateUserByID = async (model, id, options) => {
  return await model.update(
    {
      username: options.username,
      password: options.password,
      email: options.email,
    },
    {
      where: {
        id: id,
      },
    }
  );
};

const deleteUserByID = async (model, id) => {
  return await model.destroy({
    where: {
      id: id,
    },
  });
};

export {
  UserModel,
  createUser,
  findUserByID,
  updateUserByID,
  deleteUserByID,
  findUserByEmail,
  findUserByUsername,
};
