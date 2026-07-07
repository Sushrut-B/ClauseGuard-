import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

export interface KeyDate {
  label: string
  date: string
  type: 'effective' | 'expiry' | 'renewal' | 'payment' | 'notice' | 'other'
}

export interface Obligation {
  id: string
  party: 'company' | 'contractor' | 'both'
  action: string
  deadline: string | null
  category: 'payment' | 'delivery' | 'reporting' | 'confidentiality' | 'compliance' | 'other'
  status: 'pending' | 'in_progress' | 'fulfilled' | 'overdue'
}

export class Analysis extends Model {
  declare id: string
  declare contractId: string
  declare userId: string
  declare overallScore: number
  declare summary: string
  declare clauses: object
  declare keyDates: KeyDate[]
  declare obligations: Obligation[]
  declare createdAt: Date
  declare updatedAt: Date
}

Analysis.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    contractId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    overallScore: { type: DataTypes.INTEGER, allowNull: false },
    summary: { type: DataTypes.TEXT, allowNull: false },
    clauses: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    keyDates: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    obligations: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  { sequelize, tableName: 'analyses', timestamps: true }
)