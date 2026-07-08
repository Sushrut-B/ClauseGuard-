import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../utils/db'

export type AuditAction =
  | 'contract.viewed'
  | 'contract.uploaded'
  | 'contract.analyzed'
  | 'contract.deleted'
  | 'contract.stage_changed'
  | 'contract.shared'
  | 'contract.signed'
  | 'obligation.updated'
  | 'comment.added'

export class AuditLog extends Model {
  declare id: string
  declare contractId: string
  declare userId: string
  declare userEmail: string
  declare action: AuditAction
  declare metadata: object
  declare createdAt: Date
}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    contractId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: false },
    userEmail: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  },
  { sequelize, tableName: 'audit_logs', timestamps: true, updatedAt: false }
)