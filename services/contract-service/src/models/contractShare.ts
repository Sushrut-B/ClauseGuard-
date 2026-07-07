import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../utils/db'

export type ShareRole = 'viewer' | 'reviewer' | 'approver'
export type ShareStatus = 'pending' | 'accepted'

export class ContractShare extends Model {
  declare id: string
  declare contractId: string
  declare email: string
  declare name: string
  declare role: ShareRole
  declare status: ShareStatus
  declare token: string
  declare createdAt: Date
  declare updatedAt: Date
}

ContractShare.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    contractId: { type: DataTypes.UUID, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('viewer', 'reviewer', 'approver'),
      allowNull: false,
      defaultValue: 'reviewer',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted'),
      allowNull: false,
      defaultValue: 'pending',
    },
    token: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, tableName: 'contract_shares', timestamps: true }
)