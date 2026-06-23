import { Sequelize, DataTypes, Model, Optional } from 'sequelize'

interface UserAttributes {
  id: string
  email: string
  password: string | null
  name: string
  orgId: string
  role: 'admin' | 'member' | 'viewer'
  googleId: string | null
  isVerified: boolean
  refreshToken: string | null
  createdAt?: Date
  updatedAt?: Date
}

interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'password' | 'googleId' | 'isVerified' | 'refreshToken'> {}

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: string
  public email!: string
  public password!: string | null
  public name!: string
  public orgId!: string
  public role!: 'admin' | 'member' | 'viewer'
  public googleId!: string | null
  public isVerified!: boolean
  public refreshToken!: string | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

export const initUserModel = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      orgId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'member', 'viewer'),
        defaultValue: 'admin',
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
    }
  )
  return User
}