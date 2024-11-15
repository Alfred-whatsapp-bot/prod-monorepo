import { Sequelize, DataTypes } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      retry: {
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/,
          /EHOSTUNREACH/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
        ],
        max: 5,
      },
    },
    logging: false,
  }
);

export const Messages = sequelize.define(
  "messages",
  {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pattern: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buttons: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    audio: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    end: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    session: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    freezeTableName: false,
  }
);
