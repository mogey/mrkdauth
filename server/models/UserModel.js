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
    lastLoggedIn: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

async function createUser(model, username, password, email) {
  try {
    return await model.create({
      username: username,
      password: password,
      email: email,
    });
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function findAllUsers(model) {
  try {
    return await model.findAll();
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function findAllAdmins(model) {
  return await model.findAll({ where: { isAdmin: 1 } });
}

async function findUserByID(model, id) {
  return await model.findOne({ where: { id: id } });
}

async function findUserByUsername(model, username) {
  return await model.findOne({ where: { username: username } });
}

async function findUserByEmail(model, email) {
  return await model.findOne({ where: { email: email } });
}

async function updateUserByID(model, id, options) {
  try {
    return await model.update(
      {
        username: options.username,
        password: options.password,
        email: options.email,
        isAdmin: options.isAdmin,
        lastLoggedIn: options.lastLoggedIn,
        verified: options.verified,
      },
      {
        where: {
          id: id,
        },
      }
    );
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function deleteUserByID(model, id) {
  try {
    return await model.destroy({
      where: {
        id: id,
      },
    });
  } catch (err) {
    console.error(err);
    return false;
  }
}

export {
  UserModel,
  createUser,
  findUserByID,
  updateUserByID,
  deleteUserByID,
  findUserByEmail,
  findAllAdmins,
  findAllUsers,
  findUserByUsername,
};
