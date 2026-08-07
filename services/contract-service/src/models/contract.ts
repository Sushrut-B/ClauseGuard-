import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../utils/db'
export type ContractStatus = 'uploaded' | 'processing' | 'analyzed' | 'failed'
export type LifecycleStage = 'draft' | 'review' | 'approved' | 'signed' | 'active' | 'expiring' | 'expired'
export type SignatureStatus = 'none' | 'pending' | 'signed' | 'declined' | 'expired'
export class Contract extends Model {
  declare id: string
  declare userId: string
  declare fileName: string
  declare originalName: string
  declare fileSize: number
  declare mimeType: string
  declare status: ContractStatus
  declare lifecycleStage: LifecycleStage
  declare signatureStatus: SignatureStatus
  declare signatureRequestId: string | null
  declare signerEmail: string | null
  declare extractedText: string | null
  declare pageCount: number | null
  declare pages: any[] | null
  declare createdAt: Date
  declare updatedAt: Date
}
Contract.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    fileName: { type: DataTypes.STRING, allowNull: false },
    originalName: { type: DataTypes.STRING, allowNull: false },
    fileSize: { type: DataTypes.INTEGER, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.ENUM('uploaded', 'processing', 'analyzed', 'failed'),
      defaultValue: 'uploaded',
    },
    lifecycleStage: {
      type: DataTypes.ENUM('draft', 'review', 'approved', 'signed', 'active', 'expiring', 'expired'),
      defaultValue: 'draft',
      allowNull: false,
    },
    signatureStatus: {
      type: DataTypes.ENUM('none', 'pending', 'signed', 'declined', 'expired'),
      defaultValue: 'none',
      allowNull: false,
    },
    signatureRequestId: { type: DataTypes.STRING, allowNull: true },
    signerEmail: { type: DataTypes.STRING, allowNull: true },
    extractedText: { type: DataTypes.TEXT, allowNull: true },
    pageCount: { type: DataTypes.INTEGER, allowNull: true },
    pages: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    tableName: 'contracts',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'createdAt'] },
      { fields: ['status'] },
      { fields: ['lifecycleStage'] },
    ],
  }
)