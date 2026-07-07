import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../utils/db'

export type CommentType = 'general' | 'clause'
export type ReviewDecision = 'approved' | 'changes_requested' | null

export class ContractComment extends Model {
  declare id: string
  declare contractId: string
  declare authorEmail: string
  declare authorName: string
  declare type: CommentType
  declare clauseIndex: number | null
  declare text: string
  declare decision: ReviewDecision
  declare createdAt: Date
  declare updatedAt: Date
}

ContractComment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    contractId: { type: DataTypes.UUID, allowNull: false },
    authorEmail: { type: DataTypes.STRING, allowNull: false },
    authorName: { type: DataTypes.STRING, allowNull: false },
    type: {
      type: DataTypes.ENUM('general', 'clause'),
      allowNull: false,
      defaultValue: 'general',
    },
    clauseIndex: { type: DataTypes.INTEGER, allowNull: true },
    text: { type: DataTypes.TEXT, allowNull: false },
    decision: {
      type: DataTypes.ENUM('approved', 'changes_requested'),
      allowNull: true,
    },
  },
  { sequelize, tableName: 'contract_comments', timestamps: true }
)